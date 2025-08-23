/**
 * Painel de Histórico para o Editor de Diagramas
 * Gerenciamento de undo/redo e histórico de alterações
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  History,
  Undo,
  Redo,
  RotateCcw,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Move,
  Copy,
  Link,
  Palette
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface HistoryAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'connect' | 'style';
  elementType: 'node' | 'edge';
  elementId: string;
  description: string;
  timestamp: Date;
  data: any;
  previousData?: any;
}

interface HistoryPanelProps {
  nodes: Node[];
  edges: Edge[];
  onUndo?: () => void;
  onRedo?: () => void;
  onRestoreState?: (state: { nodes: Node[]; edges: Edge[] }) => void;
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  nodes,
  edges,
  onUndo,
  onRedo,
  onRestoreState,
  className
}) => {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [maxHistorySize] = useState(50);

  // Adicionar ação ao histórico
  const addToHistory = useCallback((action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    const newAction: HistoryAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setHistory(prev => {
      // Remove ações futuras se estivermos no meio do histórico
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newAction);
      
      // Limita o tamanho do histórico
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [currentIndex, maxHistorySize]);

  // Detectar mudanças nos nós e arestas
  useEffect(() => {
    // Esta é uma implementação simplificada
    // Em uma implementação real, você compararia o estado anterior
    // e detectaria mudanças específicas
  }, [nodes, edges]);

  // Executar undo
  const handleUndo = useCallback(() => {
    if (currentIndex >= 0) {
      setCurrentIndex(prev => prev - 1);
      onUndo?.();
    }
  }, [currentIndex, onUndo]);

  // Executar redo
  const handleRedo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      onRedo?.();
    }
  }, [currentIndex, history.length, onRedo]);

  // Restaurar para um ponto específico do histórico
  const restoreToPoint = useCallback((actionIndex: number) => {
    setCurrentIndex(actionIndex);
    // Aqui você implementaria a lógica para restaurar o estado
    // baseado no histórico até o ponto especificado
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Obter ícone para tipo de ação
  const getActionIcon = useCallback((action: HistoryAction) => {
    switch (action.type) {
      case 'create':
        return <Plus className="w-3 h-3" />;
      case 'update':
        return <Edit3 className="w-3 h-3" />;
      case 'delete':
        return <Trash2 className="w-3 h-3" />;
      case 'move':
        return <Move className="w-3 h-3" />;
      case 'connect':
        return <Link className="w-3 h-3" />;
      case 'style':
        return <Palette className="w-3 h-3" />;
      default:
        return <Edit3 className="w-3 h-3" />;
    }
  }, []);

  // Obter cor para tipo de ação
  const getActionColor = useCallback((action: HistoryAction) => {
    switch (action.type) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'move':
        return 'text-purple-600';
      case 'connect':
        return 'text-orange-600';
      case 'style':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  }, []);

  // Formatar timestamp
  const formatTimestamp = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    
    return timestamp.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  return (
    <Card className={cn('w-64 h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {history.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Controles de Undo/Redo */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex-1"
            >
              <Undo className="w-3 h-3 mr-1" />
              Desfazer
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex-1"
            >
              <Redo className="w-3 h-3 mr-1" />
              Refazer
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {currentIndex + 1} de {history.length}
            </span>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={clearHistory}
              className="text-xs px-2 py-1 h-auto"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
        
        {/* Lista do Histórico */}
        <ScrollArea className="h-96">
          <div className="p-2 space-y-1">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma ação realizada</p>
                <p className="text-xs mt-1">As alterações aparecerão aqui</p>
              </div>
            ) : (
              history.map((action, index) => (
                <div
                  key={action.id}
                  className={cn(
                    'flex items-start space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors',
                    index <= currentIndex ? 'opacity-100' : 'opacity-50',
                    index === currentIndex && 'bg-blue-50 border border-blue-200'
                  )}
                  onClick={() => restoreToPoint(index)}
                >
                  <div className={cn('mt-0.5', getActionColor(action))}>
                    {getActionIcon(action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {action.description}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-1 py-0"
                      >
                        {action.elementType}
                      </Badge>
                      
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(action.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {index === currentIndex && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Estatísticas */}
        {history.length > 0 && (
          <div className="p-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {history.filter(a => a.elementType === 'node').length}
                </div>
                <div className="text-gray-500">Nós</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {history.filter(a => a.elementType === 'edge').length}
                </div>
                <div className="text-gray-500">Conexões</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { HistoryPanel };
export type { HistoryAction };