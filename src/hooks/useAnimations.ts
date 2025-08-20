import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnimation, useInView } from 'framer-motion';
import { useAnimationSystem } from '../components/animations/AnimationSystem';
import {
  AnimationConfig,
  AnimationType,
  AnimationEvent,
  AnimationControlsState
} from '../types/animations';

interface UseAnimationOptions {
  trigger?: 'onMount' | 'onHover' | 'onClick' | 'onScroll' | 'manual';
  threshold?: number;
  once?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

export const useAnimation = (config: AnimationConfig, options: UseAnimationOptions = {}) => {
  const {
    trigger = 'onMount',
    threshold = 0.1,
    once = true,
    onStart,
    onComplete,
    onUpdate
  } = options;

  const { emitEvent, config: systemConfig } = useAnimationSystem();
  const controls = useAnimation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { threshold, once });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const playAnimation = useCallback(async () => {
    if (systemConfig.reducedMotion || isAnimating) return;

    try {
      setIsAnimating(true);
      onStart?.();
      
      emitEvent({
        type: 'start',
        elementId: ref.current?.id || 'unknown',
        animationId: config.type,
        timestamp: Date.now()
      });

      await controls.start('visible');
      
      onComplete?.();
      setHasAnimated(true);
      
      emitEvent({
        type: 'complete',
        elementId: ref.current?.id || 'unknown',
        animationId: config.type,
        progress: 1,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Animation error:', error);
    } finally {
      setIsAnimating(false);
    }
  }, [config, controls, emitEvent, isAnimating, onComplete, onStart, systemConfig.reducedMotion]);

  const resetAnimation = useCallback(() => {
    controls.set('hidden');
    setHasAnimated(false);
    setIsAnimating(false);
  }, [controls]);

  const pauseAnimation = useCallback(() => {
    controls.stop();
    setIsAnimating(false);
    
    emitEvent({
      type: 'pause',
      elementId: ref.current?.id || 'unknown',
      animationId: config.type,
      timestamp: Date.now()
    });
  }, [controls, config.type, emitEvent]);

  // Handle different triggers
  useEffect(() => {
    switch (trigger) {
      case 'onMount':
        if (!hasAnimated || !once) {
          playAnimation();
        }
        break;
      
      case 'onScroll':
        if (isInView && (!hasAnimated || !once)) {
          playAnimation();
        }
        break;
    }
  }, [trigger, isInView, hasAnimated, once, playAnimation]);

  const handlers = {
    onClick: trigger === 'onClick' ? () => {
      if (!once) resetAnimation();
      setTimeout(playAnimation, 50);
    } : undefined,
    
    onMouseEnter: trigger === 'onHover' ? playAnimation : undefined,
    
    onMouseLeave: trigger === 'onHover' ? resetAnimation : undefined
  };

  return {
    ref,
    controls,
    isAnimating,
    hasAnimated,
    playAnimation,
    resetAnimation,
    pauseAnimation,
    handlers
  };
};

export const useAnimationSequence = (animations: AnimationConfig[], options: UseAnimationOptions = {}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playSequence = useCallback(async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setCurrentIndex(0);
    setProgress(0);
    
    for (let i = 0; i < animations.length; i++) {
      setCurrentIndex(i);
      
      // Wait for animation duration + delay
      const duration = (animations[i].duration + (animations[i].delay || 0)) * 1000;
      
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, duration);
      });
      
      setProgress((i + 1) / animations.length);
    }
    
    setIsPlaying(false);
    options.onComplete?.();
  }, [animations, isPlaying, options]);

  const stopSequence = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
    setCurrentIndex(0);
    setProgress(0);
  }, []);

  const pauseSequence = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    currentAnimation: animations[currentIndex],
    currentIndex,
    isPlaying,
    progress,
    playSequence,
    stopSequence,
    pauseSequence
  };
};

export const useAnimationControls = () => {
  const [state, setState] = useState<AnimationControlsState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    progress: 0
  });

  const updateState = useCallback((updates: Partial<AnimationControlsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const play = useCallback(() => {
    updateState({ isPlaying: true, isPaused: false });
  }, [updateState]);

  const pause = useCallback(() => {
    updateState({ isPaused: !state.isPaused });
  }, [state.isPaused, updateState]);

  const stop = useCallback(() => {
    updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      progress: 0
    });
  }, [updateState]);

  const seek = useCallback((time: number) => {
    const progress = state.duration > 0 ? time / state.duration : 0;
    updateState({ currentTime: time, progress });
  }, [state.duration, updateState]);

  const setDuration = useCallback((duration: number) => {
    updateState({ duration });
  }, [updateState]);

  return {
    state,
    play,
    pause,
    stop,
    seek,
    setDuration,
    updateState
  };
};

export const useAnimationPresets = () => {
  const { library, addPreset, removePreset } = useAnimationSystem();

  const getPresetsByCategory = useCallback((category: string) => {
    return library.presets.filter(preset => preset.category === category);
  }, [library.presets]);

  const getPresetById = useCallback((id: string) => {
    return library.presets.find(preset => preset.id === id);
  }, [library.presets]);

  const createCustomPreset = useCallback((name: string, config: AnimationConfig, category: string, description?: string) => {
    const preset = {
      id: `custom-${Date.now()}`,
      name,
      description: description || `Custom ${name} animation`,
      category: category as AnimationPreset['category'],
      config
    };
    
    addPreset(preset);
    return preset;
  }, [addPreset]);

  return {
    presets: library.presets,
    getPresetsByCategory,
    getPresetById,
    createCustomPreset,
    addPreset,
    removePreset
  };
};

export const useAnimationEvents = (elementId: string) => {
  const [events, setEvents] = useState<AnimationEvent[]>([]);
  const { config } = useAnimationSystem();

  useEffect(() => {
    if (!config.onAnimationEvent) return;

    const originalHandler = config.onAnimationEvent;
    
    const wrappedHandler = (event: AnimationEvent) => {
      if (event.elementId === elementId) {
        setEvents(prev => [...prev, event]);
      }
      originalHandler(event);
    };

    // This is a simplified approach - in a real implementation,
    // you'd want to properly manage event listeners
    return () => {
      // Cleanup if needed
    };
  }, [elementId, config.onAnimationEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getEventsByType = useCallback((type: AnimationEvent['type']) => {
    return events.filter(event => event.type === type);
  }, [events]);

  return {
    events,
    clearEvents,
    getEventsByType
  };
};