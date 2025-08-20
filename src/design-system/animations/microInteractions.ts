/**
 * Sistema de Micro-interações - Design System
 * Implementa animações suaves e transições inteligentes
 */

import { keyframes } from '@emotion/react';
import { tokens } from '../tokens';

// =====================================================================================
// KEYFRAMES PERSONALIZADOS
// =====================================================================================

export const customKeyframes = {
  // Animações de entrada
  slideInFromTop: keyframes`
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  slideInFromBottom: keyframes`
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  slideInFromLeft: keyframes`
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,
  
  slideInFromRight: keyframes`
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,
  
  // Animações de escala
  scaleIn: keyframes`
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  `,
  
  scaleOut: keyframes`
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  `,
  
  // Animações de bounce
  bounceIn: keyframes`
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  `,
  
  // Animações de shake
  shake: keyframes`
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-2px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(2px);
    }
  `,
  
  // Animações de pulse
  pulseGlow: keyframes`
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(14, 165, 233, 0);
    }
  `,
  
  // Animações de loading
  shimmer: keyframes`
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  `,
  
  // Animações de progresso
  progressFill: keyframes`
    from {
      width: 0%;
    }
    to {
      width: var(--progress-width, 100%);
    }
  `,
  
  // Animações de notificação
  slideInNotification: keyframes`
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,
  
  // Animações de modal
  modalBackdropFadeIn: keyframes`
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  `,
  
  modalContentSlideIn: keyframes`
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  `
};

// =====================================================================================
// CLASSES DE ANIMAÇÃO UTILITÁRIAS
// =====================================================================================

export const animationClasses = {
  // Transições básicas
  transition: {
    all: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-300 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
    shadow: 'transition-shadow duration-300 ease-in-out'
  },
  
  // Hover effects
  hover: {
    scale: 'hover:scale-105 active:scale-95',
    lift: 'hover:-translate-y-1 hover:shadow-lg',
    glow: 'hover:shadow-lg hover:shadow-primary-500/25',
    brightness: 'hover:brightness-110',
    rotate: 'hover:rotate-3',
    skew: 'hover:skew-x-3'
  },
  
  // Focus effects
  focus: {
    ring: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    outline: 'focus:outline-none focus:ring-2 focus:ring-primary-500',
    glow: 'focus:shadow-lg focus:shadow-primary-500/25'
  },
  
  // Loading states
  loading: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    ping: 'animate-ping'
  },
  
  // Entrance animations
  entrance: {
    fadeIn: 'animate-in fade-in duration-300',
    slideInUp: 'animate-in slide-in-from-bottom-4 duration-300',
    slideInDown: 'animate-in slide-in-from-top-4 duration-300',
    slideInLeft: 'animate-in slide-in-from-left-4 duration-300',
    slideInRight: 'animate-in slide-in-from-right-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-300',
    bounceIn: 'animate-in zoom-in-50 duration-500 ease-out'
  },
  
  // Exit animations
  exit: {
    fadeOut: 'animate-out fade-out duration-200',
    slideOutUp: 'animate-out slide-out-to-top-4 duration-200',
    slideOutDown: 'animate-out slide-out-to-bottom-4 duration-200',
    slideOutLeft: 'animate-out slide-out-to-left-4 duration-200',
    slideOutRight: 'animate-out slide-out-to-right-4 duration-200',
    scaleOut: 'animate-out zoom-out-95 duration-200'
  }
};

// =====================================================================================
// FUNÇÕES DE ANIMAÇÃO
// =====================================================================================

export const createAnimation = {
  // Criar transição personalizada
  transition: (
    property: string,
    duration: keyof typeof tokens.animation.duration = 'normal',
    easing: keyof typeof tokens.animation.easing = 'inOut'
  ) => ({
    transition: `${property} ${tokens.animation.duration[duration]} ${tokens.animation.easing[easing]}`
  }),
  
  // Criar animação de entrada
  entrance: (
    type: 'fade' | 'slide' | 'scale' | 'bounce',
    direction?: 'up' | 'down' | 'left' | 'right',
    duration: keyof typeof tokens.animation.duration = 'normal'
  ) => {
    const animations = {
      fade: customKeyframes.slideInFromBottom,
      slide: direction === 'up' ? customKeyframes.slideInFromBottom :
             direction === 'down' ? customKeyframes.slideInFromTop :
             direction === 'left' ? customKeyframes.slideInFromRight :
             customKeyframes.slideInFromLeft,
      scale: customKeyframes.scaleIn,
      bounce: customKeyframes.bounceIn
    };
    
    return {
      animation: `${animations[type]} ${tokens.animation.duration[duration]} ${tokens.animation.easing.out} forwards`
    };
  },
  
  // Criar hover effect
  hover: (
    type: 'scale' | 'lift' | 'glow' | 'rotate',
    intensity: 'subtle' | 'normal' | 'strong' = 'normal'
  ) => {
    const intensityMap = {
      subtle: { scale: 1.02, lift: 2, glow: 0.1, rotate: 1 },
      normal: { scale: 1.05, lift: 4, glow: 0.25, rotate: 3 },
      strong: { scale: 1.1, lift: 8, glow: 0.4, rotate: 6 }
    };
    
    const values = intensityMap[intensity];
    
    const effects = {
      scale: {
        transform: `scale(${values.scale})`,
        transition: tokens.animation.duration.normal
      },
      lift: {
        transform: `translateY(-${values.lift}px)`,
        boxShadow: `0 ${values.lift * 2}px ${values.lift * 4}px rgba(0, 0, 0, 0.1)`,
        transition: tokens.animation.duration.normal
      },
      glow: {
        boxShadow: `0 0 20px rgba(14, 165, 233, ${values.glow})`,
        transition: tokens.animation.duration.normal
      },
      rotate: {
        transform: `rotate(${values.rotate}deg)`,
        transition: tokens.animation.duration.normal
      }
    };
    
    return effects[type];
  },
  
  // Criar animação de loading
  loading: (
    type: 'shimmer' | 'pulse' | 'dots' | 'progress',
    color: string = tokens.colors.primary[500]
  ) => {
    const animations = {
      shimmer: {
        background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
        backgroundSize: '200px 100%',
        animation: `${customKeyframes.shimmer} 1.5s infinite`
      },
      pulse: {
        animation: `${customKeyframes.pulseGlow} 2s infinite`
      },
      dots: {
        '&::after': {
          content: '""',
          animation: 'dots 1.5s infinite'
        }
      },
      progress: {
        animation: `${customKeyframes.progressFill} 2s ease-out forwards`
      }
    };
    
    return animations[type];
  }
};

// =====================================================================================
// MICRO-INTERAÇÕES ESPECÍFICAS
// =====================================================================================

export const microInteractions = {
  // Botões
  button: {
    primary: {
      base: animationClasses.transition.all,
      hover: `${animationClasses.hover.scale} ${animationClasses.hover.glow}`,
      focus: animationClasses.focus.ring,
      active: 'active:scale-95'
    },
    secondary: {
      base: animationClasses.transition.all,
      hover: animationClasses.hover.lift,
      focus: animationClasses.focus.ring
    },
    ghost: {
      base: animationClasses.transition.colors,
      hover: 'hover:bg-primary-50',
      focus: animationClasses.focus.outline
    }
  },
  
  // Cards
  card: {
    default: {
      base: animationClasses.transition.all,
      hover: animationClasses.hover.lift,
      entrance: animationClasses.entrance.fadeIn
    },
    financial: {
      base: animationClasses.transition.all,
      hover: `${animationClasses.hover.lift} ${animationClasses.hover.glow}`,
      entrance: animationClasses.entrance.slideInUp
    },
    interactive: {
      base: animationClasses.transition.all,
      hover: `${animationClasses.hover.scale} cursor-pointer`,
      active: 'active:scale-98'
    }
  },
  
  // Inputs
  input: {
    base: animationClasses.transition.all,
    focus: `${animationClasses.focus.ring} border-primary-500`,
    error: 'animate-shake border-red-500',
    success: 'border-green-500'
  },
  
  // Modais
  modal: {
    backdrop: {
      enter: 'animate-in fade-in duration-200',
      exit: 'animate-out fade-out duration-200'
    },
    content: {
      enter: 'animate-in zoom-in-95 slide-in-from-bottom-2 duration-300',
      exit: 'animate-out zoom-out-95 slide-out-to-bottom-2 duration-200'
    }
  },
  
  // Notificações
  notification: {
    enter: 'animate-in slide-in-from-right-full duration-300',
    exit: 'animate-out slide-out-to-right-full duration-200',
    shake: 'animate-shake'
  },
  
  // Tooltips
  tooltip: {
    enter: 'animate-in fade-in zoom-in-95 duration-200',
    exit: 'animate-out fade-out zoom-out-95 duration-150'
  },
  
  // Dropdowns
  dropdown: {
    enter: 'animate-in slide-in-from-top-2 fade-in duration-200',
    exit: 'animate-out slide-out-to-top-2 fade-out duration-150'
  },
  
  // Tabs
  tab: {
    base: animationClasses.transition.colors,
    active: 'border-b-2 border-primary-500',
    hover: 'hover:text-primary-600'
  },
  
  // Progress
  progress: {
    bar: 'transition-all duration-500 ease-out',
    indeterminate: 'animate-pulse'
  },
  
  // Loading states
  skeleton: {
    base: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
    shimmer: `bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-[length:200px_100%] animate-[${customKeyframes.shimmer}_1.5s_infinite]`
  }
};

// =====================================================================================
// UTILITÁRIOS DE PERFORMANCE
// =====================================================================================

export const performanceOptimizations = {
  // Otimizações para animações
  willChange: {
    transform: { willChange: 'transform' },
    opacity: { willChange: 'opacity' },
    scroll: { willChange: 'scroll-position' },
    auto: { willChange: 'auto' }
  },
  
  // Aceleração por hardware
  gpu: {
    enable: { transform: 'translateZ(0)' },
    disable: { transform: 'none' }
  },
  
  // Redução de movimento para acessibilidade
  reducedMotion: {
    respectPreference: '@media (prefers-reduced-motion: reduce)',
    disable: {
      animation: 'none !important',
      transition: 'none !important'
    }
  }
};

export default {
  customKeyframes,
  animationClasses,
  createAnimation,
  microInteractions,
  performanceOptimizations
};