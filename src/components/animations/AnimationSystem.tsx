import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  AnimationSystemConfig, 
  AnimationEvent, 
  AnimationEventHandler,
  AnimationLibrary,
  AnimationPreset,
  EasingType
} from '../../types/animations';

interface AnimationSystemContextType {
  config: AnimationSystemConfig;
  library: AnimationLibrary;
  updateConfig: (newConfig: Partial<AnimationSystemConfig>) => void;
  addPreset: (preset: AnimationPreset) => void;
  removePreset: (presetId: string) => void;
  emitEvent: (event: AnimationEvent) => void;
  getEasingFunction: (easing: EasingType) => number[];
}

const AnimationSystemContext = createContext<AnimationSystemContextType | null>(null);

const defaultPresets: AnimationPreset[] = [
  {
    id: 'fadeIn',
    name: 'Fade In',
    description: 'Elemento aparece gradualmente',
    category: 'entrance',
    config: {
      type: 'fadeIn',
      duration: 0.5,
      easing: 'easeOut'
    }
  },
  {
    id: 'slideInLeft',
    name: 'Slide In Left',
    description: 'Elemento desliza da esquerda',
    category: 'entrance',
    config: {
      type: 'slideInLeft',
      duration: 0.6,
      easing: 'easeOut'
    }
  },
  {
    id: 'scaleIn',
    name: 'Scale In',
    description: 'Elemento cresce do centro',
    category: 'entrance',
    config: {
      type: 'scaleIn',
      duration: 0.4,
      easing: 'backOut'
    }
  },
  {
    id: 'bounce',
    name: 'Bounce',
    description: 'Elemento faz movimento de salto',
    category: 'emphasis',
    config: {
      type: 'bounce',
      duration: 0.8,
      easing: 'bounceOut'
    }
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Elemento pulsa suavemente',
    category: 'emphasis',
    config: {
      type: 'pulse',
      duration: 1.0,
      repeat: 'infinite',
      easing: 'easeInOut'
    }
  },
  {
    id: 'fadeOut',
    name: 'Fade Out',
    description: 'Elemento desaparece gradualmente',
    category: 'exit',
    config: {
      type: 'fadeOut',
      duration: 0.3,
      easing: 'easeIn'
    }
  }
];

const easingFunctions = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  circIn: [0.6, 0.04, 0.98, 0.335],
  circOut: [0.075, 0.82, 0.165, 1],
  circInOut: [0.785, 0.135, 0.15, 0.86],
  backIn: [0.6, -0.28, 0.735, 0.045],
  backOut: [0.175, 0.885, 0.32, 1.275],
  backInOut: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0.175, 0.885, 0.32, 1.275],
  bounceIn: [0.6, 0.04, 0.98, 0.335],
  bounceOut: [0.075, 0.82, 0.165, 1],
  bounceInOut: [0.785, 0.135, 0.15, 0.86]
};

interface AnimationSystemProps {
  config?: Partial<AnimationSystemConfig>;
  children: React.ReactNode;
}

export const AnimationSystem: React.FC<AnimationSystemProps> = ({ 
  config: initialConfig = {}, 
  children 
}) => {
  const shouldReduceMotion = useReducedMotion();
  const eventsRef = useRef<AnimationEvent[]>([]);
  
  const [config, setConfig] = React.useState<AnimationSystemConfig>({
    globalDuration: 0.5,
    globalEasing: 'easeOut',
    reducedMotion: shouldReduceMotion || false,
    debugMode: false,
    ...initialConfig
  });

  const [library, setLibrary] = React.useState<AnimationLibrary>({
    presets: defaultPresets,
    custom: [],
    timelines: []
  });

  const updateConfig = useCallback((newConfig: Partial<AnimationSystemConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const addPreset = useCallback((preset: AnimationPreset) => {
    setLibrary(prev => ({
      ...prev,
      presets: [...prev.presets.filter(p => p.id !== preset.id), preset]
    }));
  }, []);

  const removePreset = useCallback((presetId: string) => {
    setLibrary(prev => ({
      ...prev,
      presets: prev.presets.filter(p => p.id !== presetId)
    }));
  }, []);

  const emitEvent = useCallback((event: AnimationEvent) => {
    eventsRef.current.push(event);
    
    if (config.debugMode) {
      console.log('[AnimationSystem]', event);
    }
    
    if (config.onAnimationEvent) {
      config.onAnimationEvent(event);
    }
  }, [config.debugMode, config.onAnimationEvent]);

  const getEasingFunction = useCallback((easing: EasingType) => {
    return easingFunctions[easing] || easingFunctions.easeOut;
  }, []);

  // Update reduced motion preference
  useEffect(() => {
    if (shouldReduceMotion !== null) {
      setConfig(prev => ({ ...prev, reducedMotion: shouldReduceMotion }));
    }
  }, [shouldReduceMotion]);

  const contextValue: AnimationSystemContextType = {
    config,
    library,
    updateConfig,
    addPreset,
    removePreset,
    emitEvent,
    getEasingFunction
  };

  return (
    <AnimationSystemContext.Provider value={contextValue}>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </AnimationSystemContext.Provider>
  );
};

export const useAnimationSystem = () => {
  const context = useContext(AnimationSystemContext);
  if (!context) {
    throw new Error('useAnimationSystem must be used within an AnimationSystem');
  }
  return context;
};

export default AnimationSystem;