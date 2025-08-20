// Animation System Components
export { AnimationSystem, useAnimationSystem } from './AnimationSystem';
export { AnimatedElement } from './AnimatedElement';
export { AnimationTimeline } from './AnimationTimeline';
export { AnimationControls } from './AnimationControls';
export { AnimationDemo } from './AnimationDemo';

// Animation Types
export type {
  AnimationType,
  EasingType,
  AnimationConfig,
  AnimationKeyframe,
  AnimationSequence,
  AnimationTimeline as AnimationTimelineType,
  AnimatedElementProps,
  AnimationControlsState,
  AnimationPreset,
  AnimationLibrary,
  AnimationEvent,
  AnimationEventHandler,
  AnimationSystemConfig
} from '../../types/animations';

// Re-export commonly used animation presets
export const ANIMATION_PRESETS = {
  // Entrance animations
  FADE_IN: { type: 'fadeIn' as const, duration: 0.5, easing: 'easeOut' as const },
  SLIDE_IN_LEFT: { type: 'slideInLeft' as const, duration: 0.6, easing: 'easeOut' as const },
  SLIDE_IN_RIGHT: { type: 'slideInRight' as const, duration: 0.6, easing: 'easeOut' as const },
  SLIDE_IN_UP: { type: 'slideInUp' as const, duration: 0.6, easing: 'easeOut' as const },
  SLIDE_IN_DOWN: { type: 'slideInDown' as const, duration: 0.6, easing: 'easeOut' as const },
  SCALE_IN: { type: 'scaleIn' as const, duration: 0.4, easing: 'backOut' as const },
  ROTATE_IN: { type: 'rotateIn' as const, duration: 0.8, easing: 'easeOut' as const },
  ZOOM: { type: 'zoom' as const, duration: 0.5, easing: 'easeOut' as const },
  ELASTIC: { type: 'elastic' as const, duration: 0.8, easing: 'easeOut' as const },
  
  // Exit animations
  FADE_OUT: { type: 'fadeOut' as const, duration: 0.3, easing: 'easeIn' as const },
  SLIDE_OUT_LEFT: { type: 'slideOutLeft' as const, duration: 0.4, easing: 'easeIn' as const },
  SLIDE_OUT_RIGHT: { type: 'slideOutRight' as const, duration: 0.4, easing: 'easeIn' as const },
  SLIDE_OUT_UP: { type: 'slideOutUp' as const, duration: 0.4, easing: 'easeIn' as const },
  SLIDE_OUT_DOWN: { type: 'slideOutDown' as const, duration: 0.4, easing: 'easeIn' as const },
  SCALE_OUT: { type: 'scaleOut' as const, duration: 0.3, easing: 'easeIn' as const },
  ROTATE_OUT: { type: 'rotateOut' as const, duration: 0.6, easing: 'easeIn' as const },
  
  // Emphasis animations
  BOUNCE: { type: 'bounce' as const, duration: 0.8, easing: 'bounceOut' as const },
  PULSE: { type: 'pulse' as const, duration: 1.0, repeat: 'infinite' as const, easing: 'easeInOut' as const },
  SHAKE: { type: 'shake' as const, duration: 0.6, easing: 'easeInOut' as const },
  
  // Transition animations
  FLIP: { type: 'flip' as const, duration: 0.8, easing: 'easeInOut' as const }
};

// Utility functions for common animation patterns
export const createStaggeredAnimation = (baseConfig: AnimationConfig, itemCount: number, staggerDelay: number = 0.1) => {
  return Array.from({ length: itemCount }, (_, index) => ({
    ...baseConfig,
    delay: (baseConfig.delay || 0) + (index * staggerDelay)
  }));
};

export const createSequentialAnimation = (configs: AnimationConfig[]) => {
  let totalDelay = 0;
  return configs.map(config => {
    const animationConfig = {
      ...config,
      delay: totalDelay
    };
    totalDelay += config.duration + (config.delay || 0);
    return animationConfig;
  });
};

export const createLoopingAnimation = (baseConfig: AnimationConfig, loopCount: number | 'infinite' = 'infinite') => {
  return {
    ...baseConfig,
    repeat: loopCount,
    repeatType: 'loop' as const
  };
};

export const createReversingAnimation = (baseConfig: AnimationConfig, reverseCount: number = 1) => {
  return {
    ...baseConfig,
    repeat: reverseCount,
    repeatType: 'reverse' as const
  };
};