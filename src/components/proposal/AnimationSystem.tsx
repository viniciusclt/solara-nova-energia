import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Clock,
  Layers,
  Settings,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { 
  AnimationType, 
  ElementAnimation, 
  AnimationTimeline,
  CanvasElement 
} from '../../types/proposal';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface AnimationSystemProps {
  className?: string;
  onAnimationPlay?: (timeline: AnimationTimeline) => void;
  onAnimationStop?: () => void;
}

interface TimelineKeyframe {
  id: string;
  elementId: string;
  startTime: number;
  duration: number;
  animation: ElementAnimation;
  element?: CanvasElement;
}

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const AnimationSystem: React.FC<AnimationSystemProps> = ({
  className,
  onAnimationPlay,
  onAnimationStop,
}) => {
  const {
    canvasState,
    selectedElementIds,
    updateElement,
    getElementById,
  } = useProposalEditor();

  // =====================================================================================
  // ESTADO
  // =====================================================================================

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(10); // 10 segundos por padrão
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timeline, setTimeline] = useState<TimelineKeyframe[]>([]);
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());
  const [showAnimationPanel, setShowAnimationPanel] = useState(true);
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // =====================================================================================
  // TIPOS DE ANIMAÇÃO DISPONÍVEIS
  // =====================================================================================

  const animationTypes: Array<{
    type: AnimationType;
    label: string;
    description: string;
    icon: React.ComponentType;
  }> = [
    {
      type: 'fadeIn',
      label: 'Fade In',
      description: 'Aparece gradualmente',
      icon: Eye,
    },
    {
      type: 'fadeOut',
      label: 'Fade Out',
      description: 'Desaparece gradualmente',
      icon: EyeOff,
    },
    {
      type: 'slideInLeft',
      label: 'Slide In Left',
      description: 'Desliza da esquerda',
      icon: SkipBack,
    },
    {
      type: 'slideInRight',
      label: 'Slide In Right',
      description: 'Desliza da direita',
      icon: SkipForward,
    },
    {
      type: 'slideInUp',
      label: 'Slide In Up',
      description: 'Desliza de baixo',
      icon: SkipBack,
    },
    {
      type: 'slideInDown',
      label: 'Slide In Down',
      description: 'Desliza de cima',
      icon: SkipForward,
    },
    {
      type: 'scaleIn',
      label: 'Scale In',
      description: 'Aumenta de tamanho',
      icon: Plus,
    },
    {
      type: 'scaleOut',
      label: 'Scale Out',
      description: 'Diminui de tamanho',
      icon: Square,
    },
    {
      type: 'rotateIn',
      label: 'Rotate In',
      description: 'Rotaciona aparecendo',
      icon: Rewind,
    },
    {
      type: 'bounce',
      label: 'Bounce',
      description: 'Efeito de salto',
      icon: Play,
    },
  ];

  // =====================================================================================
  // EFEITOS
  // =====================================================================================

  useEffect(() => {
    // Calcular duração total baseada nos keyframes
    if (timeline.length > 0) {
      const maxEndTime = Math.max(...timeline.map(k => k.startTime + k.duration));
      setTotalDuration(Math.max(maxEndTime, 10));
    }
  }, [timeline]);

  useEffect(() => {
    // Limpar animação quando componente desmonta
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // =====================================================================================
  // FUNÇÕES DE ANIMAÇÃO
  // =====================================================================================

  const getAnimationVariants = (animation: ElementAnimation) => {
    const { type, duration, delay, easing } = animation;
    
    const variants: {
      initial: Record<string, unknown>;
      animate: Record<string, unknown>;
      exit: Record<string, unknown>;
    } = {
      initial: {},
      animate: {},
      exit: {},
    };

    switch (type) {
      case 'fadeIn':
        variants.initial = { opacity: 0 };
        variants.animate = { opacity: 1 };
        break;
      case 'fadeOut':
        variants.initial = { opacity: 1 };
        variants.animate = { opacity: 0 };
        break;
      case 'slideInLeft':
        variants.initial = { x: -100, opacity: 0 };
        variants.animate = { x: 0, opacity: 1 };
        break;
      case 'slideInRight':
        variants.initial = { x: 100, opacity: 0 };
        variants.animate = { x: 0, opacity: 1 };
        break;
      case 'slideInUp':
        variants.initial = { y: 100, opacity: 0 };
        variants.animate = { y: 0, opacity: 1 };
        break;
      case 'slideInDown':
        variants.initial = { y: -100, opacity: 0 };
        variants.animate = { y: 0, opacity: 1 };
        break;
      case 'scaleIn':
        variants.initial = { scale: 0, opacity: 0 };
        variants.animate = { scale: 1, opacity: 1 };
        break;
      case 'scaleOut':
        variants.initial = { scale: 1, opacity: 1 };
        variants.animate = { scale: 0, opacity: 0 };
        break;
      case 'rotateIn':
        variants.initial = { rotate: -180, scale: 0, opacity: 0 };
        variants.animate = { rotate: 0, scale: 1, opacity: 1 };
        break;
      case 'bounce':
        variants.initial = { y: -30, opacity: 0 };
        variants.animate = { 
          y: [0, -10, 0], 
          opacity: 1,
          transition: {
            y: {
              repeat: 2,
              repeatType: 'reverse',
              duration: duration / 3,
            },
          },
        };
        break;
    }

    return variants;
  };

  const playAnimation = useCallback(() => {
    if (timeline.length === 0) {
      toast.warning('Nenhuma animação configurada');
      return;
    }

    setIsPlaying(true);
    setCurrentTime(0);
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 * playbackSpeed;
      setCurrentTime(elapsed);
      
      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(totalDuration);
        onAnimationStop?.();
        return;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    onAnimationPlay?.({
      keyframes: timeline.map(k => k.animation),
      duration: totalDuration,
      loop: false,
    });
    
    animationRef.current = requestAnimationFrame(animate);
  }, [timeline, totalDuration, playbackSpeed, onAnimationPlay, onAnimationStop]);

  const pauseAnimation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    onAnimationStop?.();
  }, [onAnimationStop]);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)));
  }, [totalDuration]);

  // =====================================================================================
  // GERENCIAMENTO DE KEYFRAMES
  // =====================================================================================

  const addKeyframe = useCallback((elementId: string, animationType: AnimationType) => {
    const element = getElementById(elementId);
    if (!element) return;

    const newKeyframe: TimelineKeyframe = {
      id: `keyframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      elementId,
      startTime: currentTime,
      duration: 1,
      animation: {
        type: animationType,
        duration: 1,
        delay: 0,
        easing: 'easeInOut',
        loop: false,
      },
      element,
    };

    setTimeline(prev => [...prev, newKeyframe].sort((a, b) => a.startTime - b.startTime));
    toast.success('Animação adicionada!');
  }, [currentTime, getElementById]);

  const updateKeyframe = useCallback((keyframeId: string, updates: Partial<TimelineKeyframe>) => {
    setTimeline(prev => prev.map(k => 
      k.id === keyframeId 
        ? { ...k, ...updates }
        : k
    ));
  }, []);

  const removeKeyframe = useCallback((keyframeId: string) => {
    setTimeline(prev => prev.filter(k => k.id !== keyframeId));
    setSelectedKeyframes(prev => prev.filter(id => id !== keyframeId));
  }, []);

  const duplicateKeyframe = useCallback((keyframeId: string) => {
    const keyframe = timeline.find(k => k.id === keyframeId);
    if (!keyframe) return;

    const newKeyframe: TimelineKeyframe = {
      ...keyframe,
      id: `keyframe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: keyframe.startTime + keyframe.duration + 0.5,
    };

    setTimeline(prev => [...prev, newKeyframe].sort((a, b) => a.startTime - b.startTime));
  }, [timeline]);

  // =====================================================================================
  // COMPONENTES DE UI
  // =====================================================================================

  const TimelineRuler = () => {
    const steps = Math.ceil(totalDuration);
    const stepWidth = 100; // pixels por segundo

    return (
      <div className="relative h-8 bg-gray-100 border-b border-gray-200">
        {Array.from({ length: steps + 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full flex items-center"
            style={{ left: i * stepWidth }}
          >
            <div className="w-px h-full bg-gray-300" />
            <span className="text-xs text-gray-600 ml-1">{i}s</span>
          </div>
        ))}
        
        {/* Indicador de tempo atual */}
        <div
          className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
          style={{ left: currentTime * stepWidth }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      </div>
    );
  };

  const KeyframeTrack: React.FC<{ elementId: string; keyframes: TimelineKeyframe[] }> = ({ 
    elementId, 
    keyframes 
  }) => {
    const element = getElementById(elementId);
    const isExpanded = expandedElements.has(elementId);
    const stepWidth = 100;

    return (
      <div className="border-b border-gray-200">
        <div className="flex items-center p-2 bg-gray-50">
          <button
            onClick={() => {
              const newExpanded = new Set(expandedElements);
              if (isExpanded) {
                newExpanded.delete(elementId);
              } else {
                newExpanded.add(elementId);
              }
              setExpandedElements(newExpanded);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          <div className="flex-1 ml-2">
            <div className="text-sm font-medium text-gray-900">
              {element?.type || 'Elemento'} - {elementId.slice(-8)}
            </div>
            <div className="text-xs text-gray-500">
              {keyframes.length} animaç{keyframes.length !== 1 ? 'ões' : 'ão'}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {animationTypes.slice(0, 3).map(({ type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addKeyframe(elementId, type)}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title={`Adicionar ${type}`}
              >
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
        
        {isExpanded && (
          <div className="relative h-12 bg-white">
            {keyframes.map(keyframe => (
              <div
                key={keyframe.id}
                className={cn(
                  "absolute top-1 h-10 bg-blue-500 rounded cursor-pointer transition-all",
                  selectedKeyframes.includes(keyframe.id) && "ring-2 ring-blue-300"
                )}
                style={{
                  left: keyframe.startTime * stepWidth,
                  width: keyframe.duration * stepWidth,
                }}
                onClick={() => {
                  setSelectedKeyframes(prev => 
                    prev.includes(keyframe.id)
                      ? prev.filter(id => id !== keyframe.id)
                      : [...prev, keyframe.id]
                  );
                }}
                title={`${keyframe.animation.type} (${keyframe.startTime}s - ${keyframe.startTime + keyframe.duration}s)`}
              >
                <div className="p-1 text-white text-xs truncate">
                  {keyframe.animation.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AnimationControls = () => (
    <div className="flex items-center space-x-2 p-3 bg-white border-t border-gray-200">
      <button
        onClick={() => seekTo(0)}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Voltar ao início"
      >
        <SkipBack className="w-4 h-4" />
      </button>
      
      <button
        onClick={isPlaying ? pauseAnimation : playAnimation}
        className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
        title={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      
      <button
        onClick={stopAnimation}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Parar"
      >
        <Square className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => seekTo(totalDuration)}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Ir para o final"
      >
        <SkipForward className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">
          {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
      </div>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <select
        value={playbackSpeed}
        onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
        className="text-sm border border-gray-300 rounded px-2 py-1"
      >
        <option value={0.25}>0.25x</option>
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={1.5}>1.5x</option>
        <option value={2}>2x</option>
      </select>
      
      <div className="flex-1" />
      
      {selectedKeyframes.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {selectedKeyframes.length} selecionado{selectedKeyframes.length !== 1 ? 's' : ''}
          </span>
          
          <button
            onClick={() => {
              selectedKeyframes.forEach(id => duplicateKeyframe(id));
              setSelectedKeyframes([]);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              selectedKeyframes.forEach(id => removeKeyframe(id));
              setSelectedKeyframes([]);
            }}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  // =====================================================================================
  // RENDER
  // =====================================================================================

  if (!showAnimationPanel) {
    return (
      <button
        onClick={() => setShowAnimationPanel(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Mostrar painel de animações"
      >
        <Play className="w-5 h-5" />
      </button>
    );
  }

  // Agrupar keyframes por elemento
  const keyframesByElement = timeline.reduce((acc, keyframe) => {
    if (!acc[keyframe.elementId]) {
      acc[keyframe.elementId] = [];
    }
    acc[keyframe.elementId].push(keyframe);
    return acc;
  }, {} as Record<string, TimelineKeyframe[]>);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40",
        className
      )}
      style={{ height: '300px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Timeline de Animações</h3>
          <span className="text-sm text-gray-500">
            ({timeline.length} animaç{timeline.length !== 1 ? 'ões' : 'ão'})
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAnimationPanel(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Ocultar painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <TimelineRuler />
        
        <div className="flex-1 overflow-y-auto">
          {Object.keys(keyframesByElement).length > 0 ? (
            Object.entries(keyframesByElement).map(([elementId, keyframes]) => (
              <KeyframeTrack
                key={elementId}
                elementId={elementId}
                keyframes={keyframes}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma animação configurada</p>
                <p className="text-xs mt-1">Selecione um elemento e adicione animações</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <AnimationControls />
    </motion.div>
  );
};

export default AnimationSystem;