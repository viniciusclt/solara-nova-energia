// =====================================================
// PÁGINA DE AVALIAÇÃO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  RotateCcw
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrainingAssessment } from '../hooks/useTraining';
import AssessmentViewer from '../components/AssessmentViewer';
import type { AssessmentResult } from '../types';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const AssessmentPage: React.FC = () => {
  const { assessmentId, moduleId } = useParams<{ assessmentId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const {
    data: assessment,
    isLoading,
    error
  } = useTrainingAssessment(assessmentId!);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    setShowResult(true);
  };

  const handleRetakeAssessment = () => {
    setAssessmentResult(null);
    setShowResult(false);
  };

  const handleBackToModule = () => {
    navigate(`/training/modules/${moduleId}`);
  };

  const handleBackToModules = () => {
    navigate('/training/modules');
  };

  // =====================================================
  // LOADING E ERROR STATES
  // =====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Avaliação não encontrada</h2>
              <p className="text-gray-600 mb-6">A avaliação solicitada não foi encontrada ou você não tem permissão para acessá-la.</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleBackToModule} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Módulo
                </Button>
                <Button onClick={handleBackToModules}>
                  Ver Todos os Módulos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =====================================================
  // RESULTADO DA AVALIAÇÃO
  // =====================================================

  if (showResult && assessmentResult) {
    const passed = assessmentResult.score >= (assessment.passingScore || 70);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{assessment.title}</CardTitle>
                    <p className="text-gray-600 mt-2">Resultado da Avaliação</p>
                  </div>
                  <Button onClick={handleBackToModule} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Módulo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  {passed ? (
                    <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="h-24 w-24 text-red-500 mx-auto mb-4" />
                  )}
                  
                  <h3 className={`text-3xl font-bold mb-2 ${
                    passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passed ? 'Parabéns!' : 'Não foi dessa vez'}
                  </h3>
                  
                  <p className="text-xl text-gray-600 mb-6">
                    Sua pontuação: <span className="font-bold">{assessmentResult.score}%</span>
                  </p>
                  
                  <div className="max-w-md mx-auto mb-6">
                    <Progress 
                      value={assessmentResult.score} 
                      className={`h-3 ${passed ? 'bg-green-100' : 'bg-red-100'}`}
                    />
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    {!passed && (
                      <Button onClick={handleRetakeAssessment} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Tentar Novamente
                      </Button>
                    )}
                    <Button onClick={handleBackToModule}>
                      {passed ? (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Continuar Treinamento
                        </>
                      ) : (
                        'Voltar ao Módulo'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // =====================================================
  // VISUALIZADOR DE AVALIAÇÃO
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{assessment.title}</CardTitle>
                  <p className="text-gray-600 mt-2">{assessment.description}</p>
                </div>
                <Button onClick={handleBackToModule} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Módulo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {assessment.timeLimit ? `${assessment.timeLimit} minutos` : 'Sem limite de tempo'}
                </Badge>
                <Badge variant="outline">
                  {assessment.questions?.length || 0} questões
                </Badge>
                <Badge variant="outline">
                  Nota mínima: {assessment.passingScore || 70}%
                </Badge>
              </div>
              
              {assessment.instructions && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {assessment.instructions}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <AssessmentViewer
            assessmentId={assessmentId!}
            moduleId={moduleId!}
            onComplete={handleAssessmentComplete}
            onClose={handleBackToModule}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentPage;