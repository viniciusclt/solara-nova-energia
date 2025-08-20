/**
 * Hook para utilização dos tokens de design
 * Fornece acesso tipado e consistente aos tokens em toda a aplicação
 */

import { useMemo } from 'react';
import { tokens } from './tokens';
import type {
  ColorScale,
  SpacingValue,
  ShadowValue,
  BorderRadiusValue,
  BreakpointValue,
  AnimationDuration,
  AnimationEasing
} from './tokens';

// =====================================================================================
// TIPOS PARA O HOOK
// =====================================================================================

interface ColorVariant {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  hover: string;
  active: string;
  disabled: string;
}

interface ComponentVariants {
  button: {
    primary: ColorVariant;
    secondary: ColorVariant;
    success: ColorVariant;
    warning: ColorVariant;
    error: ColorVariant;
    ghost: ColorVariant;
  };
  card: {
    default: ColorVariant;
    financial: ColorVariant;
    video: ColorVariant;
    proposal: ColorVariant;
  };
  input: {
    default: ColorVariant;
    error: ColorVariant;
    success: ColorVariant;
    disabled: ColorVariant;
  };
}

interface ResponsiveHelpers {
  isMobile: (width: number) => boolean;
  isTablet: (width: number) => boolean;
  isDesktop: (width: number) => boolean;
  getBreakpointValue: (breakpoint: BreakpointValue) => number;
}

interface AnimationHelpers {
  transition: (property: string, duration?: AnimationDuration, easing?: AnimationEasing) => string;
  fadeIn: (duration?: AnimationDuration) => string;
  fadeOut: (duration?: AnimationDuration) => string;
  slideIn: (direction: 'up' | 'down' | 'left' | 'right', duration?: AnimationDuration) => string;
  scaleIn: (duration?: AnimationDuration) => string;
}

// =====================================================================================
// HOOK PRINCIPAL
// =====================================================================================

export const useDesignTokens = () => {
  const componentVariants: ComponentVariants = useMemo(() => ({
    button: {
      primary: {
        primary: tokens.colors.primary[500],
        secondary: tokens.colors.primary[600],
        background: tokens.colors.primary[500],
        text: tokens.colors.neutral[0],
        border: tokens.colors.primary[500],
        hover: tokens.colors.primary[600],
        active: tokens.colors.primary[700],
        disabled: tokens.colors.neutral[300]
      },
      secondary: {
        primary: tokens.colors.secondary[500],
        secondary: tokens.colors.secondary[600],
        background: tokens.colors.secondary[500],
        text: tokens.colors.neutral[0],
        border: tokens.colors.secondary[500],
        hover: tokens.colors.secondary[600],
        active: tokens.colors.secondary[700],
        disabled: tokens.colors.neutral[300]
      },
      success: {
        primary: tokens.colors.status.success[500],
        secondary: tokens.colors.status.success[600],
        background: tokens.colors.status.success[500],
        text: tokens.colors.neutral[0],
        border: tokens.colors.status.success[500],
        hover: tokens.colors.status.success[600],
        active: tokens.colors.status.success[700],
        disabled: tokens.colors.neutral[300]
      },
      warning: {
        primary: tokens.colors.status.warning[500],
        secondary: tokens.colors.status.warning[600],
        background: tokens.colors.status.warning[500],
        text: tokens.colors.neutral[0],
        border: tokens.colors.status.warning[500],
        hover: tokens.colors.status.warning[600],
        active: tokens.colors.status.warning[700],
        disabled: tokens.colors.neutral[300]
      },
      error: {
        primary: tokens.colors.status.error[500],
        secondary: tokens.colors.status.error[600],
        background: tokens.colors.status.error[500],
        text: tokens.colors.neutral[0],
        border: tokens.colors.status.error[500],
        hover: tokens.colors.status.error[600],
        active: tokens.colors.status.error[700],
        disabled: tokens.colors.neutral[300]
      },
      ghost: {
        primary: 'transparent',
        secondary: tokens.colors.neutral[100],
        background: 'transparent',
        text: tokens.colors.primary[500],
        border: tokens.colors.primary[500],
        hover: tokens.colors.primary[50],
        active: tokens.colors.primary[100],
        disabled: tokens.colors.neutral[300]
      }
    },
    card: {
      default: {
        primary: tokens.colors.neutral[0],
        secondary: tokens.colors.neutral[50],
        background: tokens.colors.neutral[0],
        text: tokens.colors.neutral[900],
        border: tokens.colors.neutral[200],
        hover: tokens.colors.neutral[50],
        active: tokens.colors.neutral[100],
        disabled: tokens.colors.neutral[100]
      },
      financial: {
        primary: tokens.colors.neutral[0],
        secondary: tokens.colors.primary[50],
        background: tokens.colors.neutral[0],
        text: tokens.colors.neutral[900],
        border: tokens.colors.primary[200],
        hover: tokens.colors.primary[50],
        active: tokens.colors.primary[100],
        disabled: tokens.colors.neutral[100]
      },
      video: {
        primary: tokens.colors.neutral[900],
        secondary: tokens.colors.neutral[800],
        background: tokens.colors.neutral[900],
        text: tokens.colors.neutral[0],
        border: tokens.colors.neutral[700],
        hover: tokens.colors.neutral[800],
        active: tokens.colors.neutral[700],
        disabled: tokens.colors.neutral[600]
      },
      proposal: {
        primary: tokens.colors.neutral[0],
        secondary: tokens.colors.secondary[50],
        background: tokens.colors.neutral[0],
        text: tokens.colors.neutral[900],
        border: tokens.colors.secondary[200],
        hover: tokens.colors.secondary[50],
        active: tokens.colors.secondary[100],
        disabled: tokens.colors.neutral[100]
      }
    },
    input: {
      default: {
        primary: tokens.colors.neutral[0],
        secondary: tokens.colors.neutral[50],
        background: tokens.colors.neutral[0],
        text: tokens.colors.neutral[900],
        border: tokens.colors.neutral[300],
        hover: tokens.colors.neutral[400],
        active: tokens.colors.primary[500],
        disabled: tokens.colors.neutral[100]
      },
      error: {
        primary: tokens.colors.neutral[0],
        secondary: tokens.colors.status.error[50],
        background: tokens.colors.neutral[0],
        text: tokens.colors.neutral[900],
        border: tokens.colors.status.error[500],
        hover: tokens.colors.status.error[600],
        active: tokens.colors.status.error[500],
        disabled: tokens.colors.neutral[100]
      },
      success: {
        primary: tokens.colors.neutral[0],
        secondary: tokens.colors.status.success[50],
        background: tokens.colors.neutral[0],
        text: tokens.colors.neutral[900],
        border: tokens.colors.status.success[500],
        hover: tokens.colors.status.success[600],
        active: tokens.colors.status.success[500],
        disabled: tokens.colors.neutral[100]
      },
      disabled: {
        primary: tokens.colors.neutral[100],
        secondary: tokens.colors.neutral[200],
        background: tokens.colors.neutral[100],
        text: tokens.colors.neutral[400],
        border: tokens.colors.neutral[200],
        hover: tokens.colors.neutral[200],
        active: tokens.colors.neutral[200],
        disabled: tokens.colors.neutral[100]
      }
    }
  }), []);

  const responsiveHelpers: ResponsiveHelpers = useMemo(() => ({
    isMobile: (width: number) => width < parseInt(tokens.breakpoints.md),
    isTablet: (width: number) => width >= parseInt(tokens.breakpoints.md) && width < parseInt(tokens.breakpoints.lg),
    isDesktop: (width: number) => width >= parseInt(tokens.breakpoints.lg),
    getBreakpointValue: (breakpoint: BreakpointValue) => parseInt(tokens.breakpoints[breakpoint])
  }), []);

  const animationHelpers: AnimationHelpers = useMemo(() => ({
    transition: (
      property: string,
      duration: AnimationDuration = 'normal',
      easing: AnimationEasing = 'inOut'
    ) => `${property} ${tokens.animation.duration[duration]} ${tokens.animation.easing[easing]}`,
    
    fadeIn: (duration: AnimationDuration = 'normal') => 
      `opacity ${tokens.animation.duration[duration]} ${tokens.animation.easing.out}`,
    
    fadeOut: (duration: AnimationDuration = 'normal') => 
      `opacity ${tokens.animation.duration[duration]} ${tokens.animation.easing.in}`,
    
    slideIn: (
      direction: 'up' | 'down' | 'left' | 'right',
      duration: AnimationDuration = 'normal'
    ) => {
      const transforms = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)'
      };
      return `transform ${tokens.animation.duration[duration]} ${tokens.animation.easing.out}`;
    },
    
    scaleIn: (duration: AnimationDuration = 'normal') => 
      `transform ${tokens.animation.duration[duration]} ${tokens.animation.easing.bounce}`
  }), []);

  // Função para obter cor com fallback
  const getColor = (path: string, fallback: string = tokens.colors.neutral[500]) => {
    try {
      const keys = path.split('.');
      let value: unknown = tokens.colors;
      
      for (const key of keys) {
        value = value[key];
        if (value === undefined) return fallback;
      }
      
      return value;
    } catch {
      return fallback;
    }
  };

  // Função para obter espaçamento
  const getSpacing = (value: SpacingValue | number) => {
    if (typeof value === 'number') {
      return `${value * 0.25}rem`; // Converte número para rem (4 = 1rem)
    }
    return tokens.spacing[value];
  };

  // Função para obter sombra
  const getShadow = (value: ShadowValue) => {
    return tokens.shadows[value];
  };

  // Função para obter border radius
  const getBorderRadius = (value: BorderRadiusValue) => {
    return tokens.borderRadius[value];
  };

  return {
    // Tokens brutos
    tokens,
    
    // Variantes de componentes
    variants: componentVariants,
    
    // Helpers
    responsive: responsiveHelpers,
    animation: animationHelpers,
    
    // Funções utilitárias
    getColor,
    getSpacing,
    getShadow,
    getBorderRadius,
    
    // Atalhos para tokens mais usados
    colors: tokens.colors,
    spacing: tokens.spacing,
    shadows: tokens.shadows,
    borderRadius: tokens.borderRadius,
    typography: tokens.typography,
    breakpoints: tokens.breakpoints
  };
};

export default useDesignTokens;