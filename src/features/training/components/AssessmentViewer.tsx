// =====================================================
// VISUALIZADOR DE AVALIAÇÕES
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  RotateCcw,
  Send,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Flag,
  BookOpen,
  Target,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  User,
  FileText,
  CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Textarea } from '../../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { useAssessments, useAssessmentSubmission } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import type { Assessment, AssessmentQuestion, AssessmentSubmission } from '../types';

// =====================================================
// INTERFACES
// =====================================================

interface AssessmentViewerProps {
  assessmentId: string;
  moduleId: string;
  onComplete?: (result: AssessmentResult) => void;
  onClose?: () => void;
}

interface AssessmentResult {
  score: number;
  passed: boolean;
  answers: Record<string, string | number | string[]>;
  timeSpent: number;
  submissionId: string;
}

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  totalTime: number;
}

interface AnswerState {
  [questionId: string]: {
    answer: string | number | string[];
    flagged: boolean;
    timeSpent: number;
  };
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function AssessmentViewer({ assessmentId, moduleId, onComplete, onClose }: AssessmentViewerProps) {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    timeLeft: 0,
    isRunning: false,
    totalTime: 0
  });
  
  // Hooks
  const { assessment, isLoading } = useAssessments(moduleId);
  const { submitAssessment, result, isSubmitting: submissionLoading } = useAssessmentSubmission();
  
  // =====================================================
  // EFEITOS
  // =====================================================
  
  // Timer effect
  useEffect(() => {
    if (assessment?.time_limit && !timer.isRunning) {
      setTimer({
        timeLeft: assessment.time_limit * 60, // Convert minutes to seconds
        isRunning: true,
        totalTime: assessment.time_limit * 60
      });
    }
  }, [assessment]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isRunning && timer.timeLeft > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.isRunning) {
      handleAutoSubmit();
    }
    
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeLeft]);
  
  // Track time spent on each question
  useEffect(() => {
    setQuestionStartTime(Date.now());
    
    return () => {
      if (assessment?.questions?.[currentQuestionIndex]) {
        const questionId = assessment.questions[currentQuestionIndex].id;
        const timeSpent = Date.now() - questionStartTime;
        
        setAnswers(prev => ({
          ...prev,
          [questionId]: {
            ...prev[questionId],
            timeSpent: (prev[questionId]?.timeSpent || 0) + timeSpent
          }
        }));
      }
    };
  }, [currentQuestionIndex]);
  
  // =====================================================
  // HANDLERS
  // =====================================================
  
  const handleAnswerChange = (questionId: string, answer: string | number | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        flagged: prev[questionId]?.flagged || false,
        timeSpent: prev[questionId]?.timeSpent || 0
      }
    }));
  };
  
  const handleFlagQuestion = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        flagged: !prev[questionId]?.flagged,
        timeSpent: prev[questionId]?.timeSpent || 0
      }
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < (assessment?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };
  
  const handleAutoSubmit = useCallback(async () => {
    if (!assessment) return;
    
    setTimer(prev => ({ ...prev, isRunning: false }));
    await handleSubmit(true);
  }, [assessment]);
  
  const handleSubmit = async (autoSubmit = false) => {
    if (!assessment || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const totalTimeSpent = Date.now() - startTime;
      
      const submissionData = {
        assessment_id: assessmentId,
        module_id: moduleId,
        answers,
        time_spent: totalTimeSpent,
        auto_submitted: autoSubmit
      };
      
      const result = await submitAssessment(submissionData);
      
      setShowResults(true);
      setTimer(prev => ({ ...prev, isRunning: false }));
      
      onComplete?.({
        score: result.score,
        passed: result.passed,
        answers,
        timeSpent: totalTimeSpent,
        submissionId: result.id
      });
      
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // =====================================================
  // HELPERS
  // =====================================================
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getAnsweredCount = () => {
    return Object.keys(answers).filter(questionId => 
      answers[questionId]?.answer !== undefined && 
      answers[questionId]?.answer !== ''
    ).length;
  };
  
  const getFlaggedCount = () => {
    return Object.keys(answers).filter(questionId => 
      answers[questionId]?.flagged
    ).length;
  };
  
  const getProgressPercentage = () => {
    const totalQuestions = assessment?.questions?.length || 0;
    const answeredQuestions = getAnsweredCount();
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  if (!assessment) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Avaliação não encontrada
        </h3>
        <p className="text-gray-600">
          A avaliação solicitada não foi encontrada ou não está disponível.
        </p>
      </div>
    );
  }
  
  if (showResults && result) {
    return <AssessmentResults result={result} assessment={assessment} onClose={onClose} />;
  }
  
  const currentQuestion = assessment.questions?.[currentQuestionIndex];
  const totalQuestions = assessment.questions?.length || 0;
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-6 w-6 text-blue-600" />
                <span>{assessment.title}</span>
              </CardTitle>
              <CardDescription>
                {assessment.description}
              </CardDescription>
            </div>
            
            {assessment.time_limit && (
              <div className="text-right">
                <div className={`text-2xl font-mono font-bold ${
                  timer.timeLeft < 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatTime(timer.timeLeft)}
                </div>
                <p className="text-sm text-gray-600">Tempo restante</p>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso da Avaliação</span>
              <span>{getAnsweredCount()} de {totalQuestions} questões</span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
          </div>
        </CardHeader>
      </Card>
      
      {/* Warning for time */}
      {timer.timeLeft < 300 && timer.timeLeft > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Atenção! Restam menos de 5 minutos para concluir a avaliação.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Navegação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-1">
                {assessment.questions?.map((question, index) => {
                  const isAnswered = answers[question.id]?.answer !== undefined;
                  const isFlagged = answers[question.id]?.flagged;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => handleQuestionNavigation(index)}
                      className={`
                        relative w-8 h-8 text-xs font-medium rounded transition-colors
                        ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isAnswered
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Respondidas:</span>
                  <Badge variant="secondary">{getAnsweredCount()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Marcadas:</span>
                  <Badge variant="outline">{getFlaggedCount()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Restantes:</span>
                  <Badge variant="destructive">{totalQuestions - getAnsweredCount()}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Question */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Questão {currentQuestionIndex + 1} de {totalQuestions}
                </CardTitle>
                <CardDescription>
                  {currentQuestion?.points} pontos
                </CardDescription>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFlagQuestion(currentQuestion?.id || '')}
                className={answers[currentQuestion?.id || '']?.flagged ? 'bg-yellow-50 border-yellow-300' : ''}
              >
                <Flag className={`h-4 w-4 ${
                  answers[currentQuestion?.id || '']?.flagged ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                {answers[currentQuestion?.id || '']?.flagged ? 'Desmarcada' : 'Marcar'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentQuestion && (
              <QuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]?.answer}
                onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              />
            )}
            
            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              <div className="flex items-center space-x-3">
                {currentQuestionIndex === totalQuestions - 1 ? (
                  <Button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Finalizar Avaliação
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: RENDERIZADOR DE QUESTÕES
// =====================================================

function QuestionRenderer({ 
  question, 
  answer, 
  onAnswerChange 
}: {
  question: AssessmentQuestion;
  answer: string | number | string[] | undefined;
  onAnswerChange: (answer: string | number | string[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {question.question}
        </h3>
      </div>
      
      {question.type === 'multiple_choice' && (
        <RadioGroup value={answer?.toString()} onValueChange={onAnswerChange}>
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}
      
      {question.type === 'true_false' && (
        <RadioGroup value={answer?.toString()} onValueChange={onAnswerChange}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="flex-1 cursor-pointer">
                Verdadeiro
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="flex-1 cursor-pointer">
                Falso
              </Label>
            </div>
          </div>
        </RadioGroup>
      )}
      
      {question.type === 'essay' && (
        <div className="space-y-2">
          <Label htmlFor="essay-answer">Sua resposta:</Label>
          <Textarea
            id="essay-answer"
            placeholder="Digite sua resposta aqui..."
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="min-h-[120px]"
          />
          <p className="text-sm text-gray-600">
            Esta questão será avaliada manualmente.
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: RESULTADOS DA AVALIAÇÃO
// =====================================================

interface AssessmentResultData {
  score: number;
  correct_answers?: number;
  time_spent?: number;
}

function AssessmentResults({ 
  result, 
  assessment, 
  onClose 
}: {
  result: AssessmentResultData;
  assessment: Assessment;
  onClose?: () => void;
}) {
  const passed = result.score >= (assessment.passing_score || 70);
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {passed ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {passed ? 'Parabéns!' : 'Não foi desta vez'}
          </CardTitle>
          
          <CardDescription className="text-lg">
            {passed 
              ? 'Você foi aprovado na avaliação!' 
              : 'Você não atingiu a nota mínima necessária.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              passed ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.score}%
            </div>
            <p className="text-gray-600">
              Nota mínima: {assessment.passing_score || 70}%
            </p>
          </div>
          
          <Separator />
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {result.correct_answers || 0}
              </div>
              <p className="text-sm text-gray-600">Respostas Corretas</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {Math.floor((result.time_spent || 0) / 60000)}
              </div>
              <p className="text-sm text-gray-600">Minutos Gastos</p>
            </div>
          </div>
          
          {/* Certificate */}
          {passed && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Award className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">
                    Certificado Disponível
                  </h3>
                  <p className="text-sm text-blue-700">
                    Seu certificado foi gerado automaticamente
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-center space-x-3">
            {!passed && (
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            
            <Button onClick={onClose}>
              <BookOpen className="h-4 w-4 mr-2" />
              Voltar ao Módulo
            </Button>
            
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssessmentViewer;