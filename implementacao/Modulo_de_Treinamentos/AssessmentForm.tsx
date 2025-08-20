import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrainingAssessment, AssessmentQuestion, UserAnswer, AssessmentResult } from '@/types/training';
import { TrainingService } from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  AlertCircle,
  Timer,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentFormProps {
  assessment: TrainingAssessment;
  onComplete?: (result: AssessmentResult) => void;
  className?: string;
}

export function AssessmentForm({ assessment, onComplete, className }: AssessmentFormProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [startTime] = useState(Date.now());
  const { user } = useAuth();

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const totalQuestions = assessment.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer da avaliação
  useEffect(() => {
    if (assessment.time_limit_minutes && !isCompleted) {
      setTimeRemaining(assessment.time_limit_minutes * 60);
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            submitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [assessment.time_limit_minutes, isCompleted, submitAssessment]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentAnswer = (): string | number | boolean | undefined => {
    const answer = answers.find(a => a.question_id === currentQuestion.id);
    return answer?.answer;
  };

  const updateAnswer = (answer: string | number | boolean) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.question_id === currentQuestion.id);
      if (existing) {
        return prev.map(a => 
          a.question_id === currentQuestion.id 
            ? { ...a, answer }
            : a
        );
      } else {
        return [...prev, { question_id: currentQuestion.id, answer }];
      }
    });
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitAssessment = useCallback(async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const timeTakenMinutes = Math.round((Date.now() - startTime) / 60000);
      const assessmentResult = await TrainingService.submitAssessment(
        user.id,
        assessment.id,
        answers,
        timeTakenMinutes
      );

      setResult(assessmentResult);
      setIsCompleted(true);
      onComplete?.(assessmentResult);
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error);
      alert('Erro ao submeter avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, startTime, assessment.id, answers, onComplete]);

  const isAnswered = (questionId: number): boolean => {
    return answers.some(a => a.question_id === questionId);
  };

  const canSubmit = (): boolean => {
    return answers.length === totalQuestions;
  };

  if (isCompleted && result) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {result.passed ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {result.passed ? 'Parabéns!' : 'Não foi dessa vez'}
            </CardTitle>
            <p className="text-gray-600">
              {result.passed 
                ? 'Você foi aprovado na avaliação!' 
                : 'Você não atingiu a pontuação mínima necessária.'
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.score}
                </div>
                <div className="text-sm text-gray-600">Pontuação</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((result.score / (result.total_questions * 10)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Percentual</div>
              </div>
            </div>

            <div className="text-center">
              <Badge variant={result.passed ? "default" : "destructive"}>
                {result.passed ? 'Aprovado' : 'Reprovado'}
              </Badge>
            </div>

            {result.passed && (
              <div className="text-center">
                <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Você receberá um certificado de conclusão!
                </p>
              </div>
            )}

            <div className="text-center text-sm text-gray-500">
              Tempo gasto: {result.time_taken_minutes} minutos
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header da avaliação */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{assessment.title}</CardTitle>
              {assessment.description && (
                <p className="text-gray-600 mt-1">{assessment.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-sm">
                <Timer className="h-4 w-4" />
                <span className={cn(
                  "font-mono",
                  timeRemaining < 300 && "text-red-500" // Últimos 5 minutos
                )}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Questão {currentQuestionIndex + 1} de {totalQuestions}</span>
              <span>Pontuação mínima: {assessment.passing_score}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Questão atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {currentQuestion.points} pontos
            </Badge>
            <Badge variant="secondary">
              {currentQuestion.type === 'multiple_choice' ? 'Múltipla escolha' :
               currentQuestion.type === 'true_false' ? 'Verdadeiro/Falso' : 'Texto'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {currentQuestion.type === 'multiple_choice' && (
            <RadioGroup
              value={getCurrentAnswer()?.toString()}
              onValueChange={(value) => updateAnswer(parseInt(value))}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'true_false' && (
            <RadioGroup
              value={getCurrentAnswer()?.toString()}
              onValueChange={(value) => updateAnswer(value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">Verdadeiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">Falso</Label>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === 'text' && (
            <Textarea
              placeholder="Digite sua resposta..."
              value={getCurrentAnswer() || ''}
              onChange={(e) => updateAnswer(e.target.value)}
              rows={4}
            />
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Anterior
        </Button>

        <div className="flex space-x-2">
          {/* Indicadores de questões */}
          {assessment.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                index === currentQuestionIndex
                  ? "bg-blue-500 text-white"
                  : isAnswered(assessment.questions[index].id)
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <Button
            onClick={submitAssessment}
            disabled={!canSubmit() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              'Enviando...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Finalizar
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex === totalQuestions - 1}
          >
            Próxima
          </Button>
        )}
      </div>

      {/* Aviso sobre submissão */}
      {!canSubmit() && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Responda todas as questões antes de finalizar a avaliação.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

