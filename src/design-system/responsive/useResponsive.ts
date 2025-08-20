/**
 * Hook de Responsividade - Design System
 * Gerencia detecção de breakpoints e adaptação responsiva
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { breakpoints, deviceCategories, responsiveTypography, responsiveSpacing } from './breakpoints';

// =====================================================================================
// TIPOS E INTERFACES
// =====================================================================================

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type DeviceType = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';

interface ScreenInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  device: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  pixelRatio: number;
}

interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

interface UseResponsiveOptions {
  debounceMs?: number;
  enableOrientationDetection?: boolean;
  enableTouchDetection?: boolean;
}

// =====================================================================================
// UTILITÁRIOS
// =====================================================================================

const getBreakpointFromWidth = (width: number): Breakpoint => {
  if (width >= breakpoints.values['2xl']) return '2xl';
  if (width >= breakpoints.values.xl) return 'xl';
  if (width >= breakpoints.values.lg) return 'lg';
  if (width >= breakpoints.values.md) return 'md';
  if (width >= breakpoints.values.sm) return 'sm';
  return 'xs';
};

const getDeviceFromBreakpoint = (breakpoint: Breakpoint): DeviceType => {
  if (['xs', 'sm'].includes(breakpoint)) return 'mobile';
  if (breakpoint === 'md') return 'tablet';
  return 'desktop';
};

const getOrientationFromDimensions = (width: number, height: number): Orientation => {
  return width > height ? 'landscape' : 'portrait';
};

const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const getPixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};

// =====================================================================================
// HOOK PRINCIPAL
// =====================================================================================

export const useResponsive = (options: UseResponsiveOptions = {}) => {
  const {
    debounceMs = 150,
    enableOrientationDetection = true,
    enableTouchDetection = true
  } = options;

  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        breakpoint: 'lg' as Breakpoint,
        device: 'desktop' as DeviceType,
        orientation: 'landscape' as Orientation,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        pixelRatio: 1
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpointFromWidth(width);
    const device = getDeviceFromBreakpoint(breakpoint);
    const orientation = getOrientationFromDimensions(width, height);
    const isTouch = enableTouchDetection ? isTouchDevice() : false;
    const pixelRatio = getPixelRatio();

    return {
      width,
      height,
      breakpoint,
      device,
      orientation,
      isMobile: device === 'mobile',
      isTablet: device === 'tablet',
      isDesktop: device === 'desktop',
      isTouch,
      pixelRatio
    };
  });

  // Debounced resize handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const breakpoint = getBreakpointFromWidth(width);
        const device = getDeviceFromBreakpoint(breakpoint);
        const orientation = enableOrientationDetection 
          ? getOrientationFromDimensions(width, height)
          : screenInfo.orientation;
        const isTouch = enableTouchDetection ? isTouchDevice() : screenInfo.isTouch;
        const pixelRatio = getPixelRatio();

        setScreenInfo({
          width,
          height,
          breakpoint,
          device,
          orientation,
          isMobile: device === 'mobile',
          isTablet: device === 'tablet',
          isDesktop: device === 'desktop',
          isTouch,
          pixelRatio
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    
    if (enableOrientationDetection) {
      window.addEventListener('orientationchange', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (enableOrientationDetection) {
        window.removeEventListener('orientationchange', handleResize);
      }
      clearTimeout(timeoutId);
    };
  }, [debounceMs, enableOrientationDetection, enableTouchDetection, screenInfo.orientation, screenInfo.isTouch]);

  // =====================================================================================
  // FUNÇÕES UTILITÁRIAS
  // =====================================================================================

  const isBreakpoint = useCallback((bp: Breakpoint): boolean => {
    return screenInfo.breakpoint === bp;
  }, [screenInfo.breakpoint]);

  const isBreakpointUp = useCallback((bp: Breakpoint): boolean => {
    const currentIndex = Object.keys(breakpoints.values).indexOf(screenInfo.breakpoint);
    const targetIndex = Object.keys(breakpoints.values).indexOf(bp);
    return currentIndex >= targetIndex;
  }, [screenInfo.breakpoint]);

  const isBreakpointDown = useCallback((bp: Breakpoint): boolean => {
    const currentIndex = Object.keys(breakpoints.values).indexOf(screenInfo.breakpoint);
    const targetIndex = Object.keys(breakpoints.values).indexOf(bp);
    return currentIndex <= targetIndex;
  }, [screenInfo.breakpoint]);

  const isBreakpointBetween = useCallback((min: Breakpoint, max: Breakpoint): boolean => {
    return isBreakpointUp(min) && isBreakpointDown(max);
  }, [isBreakpointUp, isBreakpointDown]);

  // =====================================================================================
  // RESPONSIVE VALUES
  // =====================================================================================

  const getResponsiveValue = useCallback(<T>(
    values: ResponsiveValue<T>,
    fallback?: T
  ): T | undefined => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(screenInfo.breakpoint);
    
    // Procurar valor do breakpoint atual ou menor
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    return fallback;
  }, [screenInfo.breakpoint]);

  const getTypographyScale = useCallback((element: keyof typeof responsiveTypography.scales.xs) => {
    return responsiveTypography.scales[screenInfo.breakpoint]?.[element] || 
           responsiveTypography.scales.md[element];
  }, [screenInfo.breakpoint]);

  const getSpacingScale = useCallback((size: keyof typeof responsiveSpacing.scales.xs) => {
    return responsiveSpacing.scales[screenInfo.breakpoint]?.[size] || 
           responsiveSpacing.scales.md[size];
  }, [screenInfo.breakpoint]);

  // =====================================================================================
  // CSS CLASSES HELPERS
  // =====================================================================================

  const getResponsiveClasses = useCallback((classMap: ResponsiveValue<string>): string => {
    const classes: string[] = [];
    
    Object.entries(classMap).forEach(([bp, className]) => {
      if (className) {
        if (bp === 'xs') {
          classes.push(className);
        } else {
          classes.push(`${bp}:${className}`);
        }
      }
    });
    
    return classes.join(' ');
  }, []);

  const getGridClasses = useCallback((type: 'financial' | 'video' | 'proposal') => {
    const gridMap = {
      financial: {
        xs: 'grid-cols-1',
        sm: 'grid-cols-1',
        md: 'grid-cols-2',
        lg: 'grid-cols-3',
        xl: 'grid-cols-4'
      },
      video: {
        xs: 'grid-cols-1',
        sm: 'grid-cols-2',
        md: 'grid-cols-2',
        lg: 'grid-cols-3',
        xl: 'grid-cols-4'
      },
      proposal: {
        xs: 'grid-cols-1',
        sm: 'grid-cols-1',
        md: 'grid-cols-2',
        lg: 'grid-cols-2',
        xl: 'grid-cols-3'
      }
    };
    
    return getResponsiveClasses(gridMap[type]);
  }, [getResponsiveClasses]);

  // =====================================================================================
  // MEDIA QUERY HELPERS
  // =====================================================================================

  const matchesMediaQuery = useCallback((query: string): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, []);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return matchesMediaQuery('(prefers-reduced-motion: reduce)');
  }, [matchesMediaQuery]);

  const prefersDarkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return matchesMediaQuery('(prefers-color-scheme: dark)');
  }, [matchesMediaQuery]);

  const prefersHighContrast = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return matchesMediaQuery('(prefers-contrast: high)');
  }, [matchesMediaQuery]);

  // =====================================================================================
  // CONTAINER HELPERS
  // =====================================================================================

  const getContainerClasses = useCallback((type: 'default' | 'content' | 'narrow' | 'wide' = 'default') => {
    const containerMap = {
      default: 'container mx-auto px-4 sm:px-6 lg:px-8',
      content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
      wide: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8'
    };
    
    return containerMap[type];
  }, []);

  // =====================================================================================
  // RETURN DO HOOK
  // =====================================================================================

  return {
    // Screen info
    ...screenInfo,
    
    // Breakpoint checks
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    
    // Responsive values
    getResponsiveValue,
    getTypographyScale,
    getSpacingScale,
    
    // CSS helpers
    getResponsiveClasses,
    getGridClasses,
    getContainerClasses,
    
    // Media query helpers
    matchesMediaQuery,
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,
    
    // Constants
    breakpoints: breakpoints.values,
    deviceCategories
  };
};

// =====================================================================================
// HOOKS ESPECIALIZADOS
// =====================================================================================

// Hook para detecção de device
export const useDevice = () => {
  const { device, isMobile, isTablet, isDesktop, isTouch } = useResponsive();
  
  return {
    device,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    
    // Helpers específicos
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
    canHover: !isTouch
  };
};

// Hook para breakpoints específicos
export const useBreakpoint = () => {
  const { breakpoint, isBreakpoint, isBreakpointUp, isBreakpointDown } = useResponsive();
  
  return {
    current: breakpoint,
    is: isBreakpoint,
    up: isBreakpointUp,
    down: isBreakpointDown,
    
    // Shortcuts comuns
    isMobile: isBreakpointDown('sm'),
    isTablet: isBreakpoint('md'),
    isDesktop: isBreakpointUp('lg'),
    isLargeScreen: isBreakpointUp('xl')
  };
};

// Hook para orientação
export const useOrientation = () => {
  const { orientation, width, height } = useResponsive({ enableOrientationDetection: true });
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    aspectRatio: width / height,
    
    // Helpers
    isSquare: Math.abs(width - height) < 100,
    isWide: width / height > 1.5,
    isTall: height / width > 1.5
  };
};

export default useResponsive;