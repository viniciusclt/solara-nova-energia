import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { TrainingService } from '@/services/trainingService';
import { 
  ModuleWithContent, 
  UserProgress, 
  AssessmentResult, 
  Certificate 
} from '@/types/training';
import { 
  CheckCircle, 
  Clock, 
  Play, 
  Award, 
  TrendingUp,
  Calendar,
  Target,
  BookOpen,
  Video,
  FileText,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  modules: ModuleWithContent[];
  selectedModuleId?: string;
  className?: string;
}

export function ProgressTracker({ modules, selectedModuleId, className }: ProgressTrackerProps) {
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { progress, getModuleProgress, isVideoCompleted } = useTrainingProgress();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [results, certs] = await Promise.all([
        TrainingService.getUserAssessmentResults(user!.id),
        TrainingService.getUserCertificates(user!.id)
      ]);
      setAssessmentResults(results);
      setCertificates(certs);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getOverallProgress = (): number => {
    if (modules.length === 0) return 0;
    const totalProgress = modules.reduce((sum, module) => sum + getModuleProgress(module.id), 0);
    return Math.round(totalProgress / modules.length);
  };

  const getCompletedModules = (): number => {
    return modules.filter(module => getModuleProgress(module.id) >= 100).length;
  };

  const getCompletedVideos = (): number => {
    let completed = 0;
    modules.forEach(module => {
      module.videos.forEach(video => {
        if (isVideoCompleted(video.id)) {
          completed++;
        }
      });
    });
    return completed;
  };

  const getTotalVideos = (): number => {
    return modules.reduce((sum, module) => sum + module.videos.length, 0);
  };

  const getPassedAssessments = (): number => {
    return assessmentResults.filter(result => result.passed).length;
  };

  const getTotalAssessments = (): number => {
    return modules.reduce((sum, module) => sum + module.assessments.length, 0);
  };

  const getModuleAssessmentResult = (moduleId: string): AssessmentResult | undefined => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || module.assessments.length === 0) return undefined;
    
    return assessmentResults.find(result => 
      module.assessments.some(assessment => assessment.id === result.assessment_id)
    );
  };

  const getModuleCertificate = (moduleId: string): Certificate | undefined => {
    return certificates.find(cert => cert.module_id === moduleId);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalWatchTime = (): number => {
    return progress.reduce((sum, p) => sum + p.watch_time_seconds, 0);
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{getOverallProgress()}%</div>
                <div className="text-sm text-gray-600">Progresso Geral</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {getCompletedModules()}/{modules.length}
                </div>
                <div className="text-sm text-gray-600">Módulos Concluídos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {getCompletedVideos()}/{getTotalVideos()}
                </div>
                <div className="text-sm text-gray-600">Vídeos Assistidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{certificates.length}</div>
                <div className="text-sm text-gray-600">Certificados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por abas */}
      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          {modules.map((module) => {
            const moduleProgress = getModuleProgress(module.id);
            const completedVideos = module.videos.filter(video => isVideoCompleted(video.id)).length;
            const assessmentResult = getModuleAssessmentResult(module.id);
            const certificate = getModuleCertificate(module.id);

            return (
              <Card key={module.id} className={cn(
                "transition-all",
                selectedModuleId === module.id && "ring-2 ring-blue-500"
              )}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      {module.description && (
                        <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {certificate && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Award className="h-3 w-3 mr-1" />
                          Certificado
                        </Badge>
                      )}
                      {moduleProgress >= 100 && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso do módulo</span>
                      <span>{moduleProgress}%</span>
                    </div>
                    <Progress value={moduleProgress} className="w-full" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{completedVideos}/{module.videos.length}</div>
                      <div className="text-gray-600">Vídeos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{module.playbooks.length}</div>
                      <div className="text-gray-600">Playbooks</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">
                        {assessmentResult ? (assessmentResult.passed ? '✓' : '✗') : '-'}
                      </div>
                      <div className="text-gray-600">Avaliação</div>
                    </div>
                  </div>

                  {assessmentResult && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Pontuação da avaliação:</span>
                        <span className={cn(
                          "font-semibold",
                          assessmentResult.passed ? "text-green-600" : "text-red-600"
                        )}>
                          {Math.round((assessmentResult.score / (assessmentResult.total_questions * 10)) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          {assessmentResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma avaliação realizada</h3>
                <p className="text-gray-600">
                  Complete os módulos para realizar as avaliações.
                </p>
              </CardContent>
            </Card>
          ) : (
            assessmentResults.map((result) => {
              const module = modules.find(m => 
                m.assessments.some(a => a.id === result.assessment_id)
              );
              const assessment = module?.assessments.find(a => a.id === result.assessment_id);

              return (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{assessment?.title}</h3>
                        <p className="text-sm text-gray-600">{module?.title}</p>
                      </div>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <div className="font-semibold">{result.score} pontos</div>
                        <div className="text-gray-600">Pontuação</div>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {Math.round((result.score / (result.total_questions * 10)) * 100)}%
                        </div>
                        <div className="text-gray-600">Percentual</div>
                      </div>
                      <div>
                        <div className="font-semibold">{result.time_taken_minutes}min</div>
                        <div className="text-gray-600">Tempo gasto</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(result.completed_at).toLocaleString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum certificado obtido</h3>
                <p className="text-gray-600">
                  Complete os módulos e passe nas avaliações para obter certificados.
                </p>
              </CardContent>
            </Card>
          ) : (
            certificates.map((certificate) => {
              const module = modules.find(m => m.id === certificate.module_id);

              return (
                <Card key={certificate.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{module?.title}</h3>
                        <p className="text-sm text-gray-600">
                          Certificado #{certificate.certificate_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Tempo de Estudo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatDuration(getTotalWatchTime())}
                </div>
                <p className="text-gray-600">Tempo total assistido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Desempenho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Avaliações aprovadas:</span>
                    <span className="font-semibold">
                      {getPassedAssessments()}/{getTotalAssessments()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de aprovação:</span>
                    <span className="font-semibold text-green-600">
                      {getTotalAssessments() > 0 
                        ? Math.round((getPassedAssessments() / getTotalAssessments()) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

