/**
 * Gerenciador de Status
 * 
 * Componente para gerenciar o status das funcionalidades do roadmap,
 * incluindo histórico de mudanças e atualizações de progresso
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  PlayCircle, 
  PauseCircle,
  Calendar,
  User,
  MessageSquare,
  Save,
  History,
  TrendingUp,
  Loader2,
  Edit3,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStatusUpdates } from '@/hooks/useStatusUpdates';
import { useRoadmapData } from '@/hooks/useRoadmapData';
import { useNotifications } from '@/hooks/useNotifications';
import type {
  RoadmapFeature,
  FeatureStatus,
  FeatureStatusHistory,
  UpdateFeatureRequest
} from '@/types/roadmap';
import { 
  FEATURE_STATUS_LABELS,
  FEATURE_STATUS_COLORS
} from '@/types/roadmap';

export interface StatusManagerProps {
  feature: RoadmapFeature;
  currentUserId?: string;
  isAdmin?: boolean;
  onStatusChange?: (newStatus: FeatureStatus) => void;
  className?: string;
}

interface StatusUpdateForm {
  status: FeatureStatus;
  notes: string;
  progress_percentage?: number;
}

const STATUS_ICONS = {
  pending: Clock,
  under_review: Eye,
  approved: CheckCircle,
  in_progress: PlayCircle,
  testing: AlertCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  on_hold: PauseCircle
} as const;

const STATUS_PROGRESS = {
  pending: 0,
  under_review: 10,
  approved: 20,
  in_progress: 50,
  testing: 80,
  completed: 100,
  cancelled: 0,
  on_hold: 0
} as const;

export function StatusManager({ 
  feature, 
  currentUserId, 
  isAdmin = false, 
  onStatusChange,
  className 
}: StatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [updateForm, setUpdateForm] = useState<StatusUpdateForm>({
    status: feature.status,
    notes: '',
    progress_percentage: feature.progress_percentage
  });
  
  const {
    statusHistory,
    isLoading: isLoadingHistory,
    updateStatus,
    refreshHistory
  } = useStatusUpdates(feature.id);
  
  const { updateFeature } = useRoadmapData();
  const { addNotification } = useNotifications();
  
  // Atualizar formulário quando feature mudar
  useEffect(() => {
    setUpdateForm({
      status: feature.status,
      notes: '',
      progress_percentage: feature.progress_percentage
    });
  }, [feature]);
  
  // Atualizar status
  const handleStatusUpdate = async () => {
    if (!isAdmin) {
      addNotification({
        type: 'error',
        title: 'Acesso negado',
        message: 'Apenas administradores podem atualizar o status'
      });
      return;
    }
    
    if (updateForm.status === feature.status && !updateForm.notes.trim()) {
      addNotification({
        type: 'warning',
        title: 'Nenhuma alteração',
        message: 'Selecione um novo status ou adicione uma nota'
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Atualizar status na funcionalidade
      if (updateForm.status !== feature.status || updateForm.progress_percentage !== feature.progress_percentage) {
        const updateRequest: UpdateFeatureRequest = {
          status: updateForm.status,
          progress_percentage: updateForm.progress_percentage
        };
        
        await updateFeature(feature.id, updateRequest);
      }
      
      // Adicionar entrada no histórico se houver notas ou mudança de status
      if (updateForm.notes.trim() || updateForm.status !== feature.status) {
        await updateStatus({
          old_status: feature.status,
          new_status: updateForm.status,
          notes: updateForm.notes.trim() || undefined,
          progress_percentage: updateForm.progress_percentage
        });
      }
      
      // Atualizar histórico
      await refreshHistory();
      
      // Notificar mudança
      onStatusChange?.(updateForm.status);
      
      // Limpar formulário
      setUpdateForm(prev => ({
        ...prev,
        notes: ''
      }));
      
      addNotification({
        type: 'success',
        title: 'Status atualizado',
        message: 'O status da funcionalidade foi atualizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar',
        message: 'Não foi possível atualizar o status da funcionalidade'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Calcular progresso baseado no status
  const getProgressFromStatus = (status: FeatureStatus): number => {
    return STATUS_PROGRESS[status];
  };
  
  // Renderizar entrada do histórico
  const renderHistoryEntry = (entry: FeatureStatusHistory) => {
    const StatusIcon = STATUS_ICONS[entry.new_status];
    const OldStatusIcon = STATUS_ICONS[entry.old_status];
    
    return (
      <div key={entry.id} className="flex space-x-3 py-3">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <StatusIcon className="h-4 w-4" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {entry.user_name || 'Sistema'}
            </span>
            <span className="text-xs text-muted-foreground flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(entry.created_at).toLocaleString()}</span>
            </span>
          </div>
          
          <div className="mt-1 flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <OldStatusIcon className="h-3 w-3" />
              <Badge 
                variant="outline" 
                className={`text-xs ${FEATURE_STATUS_COLORS[entry.old_status]}`}
              >
                {FEATURE_STATUS_LABELS[entry.old_status]}
              </Badge>
            </div>
            
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            
            <div className="flex items-center space-x-1">
              <StatusIcon className="h-3 w-3" />
              <Badge 
                variant="outline" 
                className={`text-xs ${FEATURE_STATUS_COLORS[entry.new_status]}`}
              >
                {FEATURE_STATUS_LABELS[entry.new_status]}
              </Badge>
            </div>
          </div>
          
          {entry.notes && (
            <p className="mt-2 text-sm text-muted-foreground">
              {entry.notes}
            </p>
          )}
          
          {entry.progress_percentage !== null && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Progresso:</span>
                <Progress value={entry.progress_percentage} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground">
                  {entry.progress_percentage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const StatusIcon = STATUS_ICONS[feature.status];
  const currentProgress = feature.progress_percentage ?? getProgressFromStatus(feature.status);
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StatusIcon className="h-5 w-5" />
            <span>Status Atual</span>
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso de desenvolvimento desta funcionalidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status e progresso */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusIcon className="h-4 w-4" />
                <Badge 
                  variant="outline" 
                  className={FEATURE_STATUS_COLORS[feature.status]}
                >
                  {FEATURE_STATUS_LABELS[feature.status]}
                </Badge>
              </div>
              
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    Ver Histórico
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-4xl h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Histórico de Status</DialogTitle>
                    <DialogDescription>
                      Todas as mudanças de status desta funcionalidade
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4">
                    {isLoadingHistory ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex space-x-3">
                            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                              <div className="h-12 bg-muted animate-pulse rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : statusHistory && statusHistory.length > 0 ? (
                      <div className="space-y-0 divide-y">
                        {statusHistory.map(renderHistoryEntry)}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum histórico</h3>
                        <p className="text-muted-foreground">
                          Esta funcionalidade ainda não teve mudanças de status
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm text-muted-foreground">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
            </div>
            
            {/* Informações adicionais */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Criado em:</span>
                <p className="font-medium">
                  {new Date(feature.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Última atualização:</span>
                <p className="font-medium">
                  {new Date(feature.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Atualizar status (apenas para admins) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5" />
              <span>Atualizar Status</span>
            </CardTitle>
            <CardDescription>
              Atualize o status e progresso desta funcionalidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Seletor de status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Novo Status</label>
                <Select 
                  value={updateForm.status} 
                  onValueChange={(value) => 
                    setUpdateForm(prev => ({ 
                      ...prev, 
                      status: value as FeatureStatus,
                      progress_percentage: getProgressFromStatus(value as FeatureStatus)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEATURE_STATUS_LABELS).map(([value, label]) => {
                      const Icon = STATUS_ICONS[value as FeatureStatus];
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Progresso personalizado */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Progresso (%)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={updateForm.progress_percentage || 0}
                    onChange={(e) => 
                      setUpdateForm(prev => ({ 
                        ...prev, 
                        progress_percentage: parseInt(e.target.value) 
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {updateForm.progress_percentage || 0}%
                  </span>
                </div>
              </div>
              
              {/* Notas */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas da Atualização</label>
                <Textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Adicione detalhes sobre esta atualização de status..."
                  className="min-h-[80px]"
                />
              </div>
              
              {/* Botão de atualizar */}
              <div className="flex items-center justify-end">
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                  className="min-w-[120px]"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Atualizar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Timeline de status (versão compacta) */}
      {statusHistory && statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Últimas Atualizações</span>
            </CardTitle>
            <CardDescription>
              Histórico recente de mudanças de status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusHistory.slice(0, 3).map((entry) => {
                const StatusIcon = STATUS_ICONS[entry.new_status];
                return (
                  <div key={entry.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                        <StatusIcon className="h-3 w-3" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${FEATURE_STATUS_COLORS[entry.new_status]}`}
                        >
                          {FEATURE_STATUS_LABELS[entry.new_status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {statusHistory.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHistory(true)}
                  className="w-full"
                >
                  Ver todas as {statusHistory.length} atualizações
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}