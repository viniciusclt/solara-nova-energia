/**
 * Design System - Solara Nova Energia
 * Exportações centralizadas de todos os componentes e tokens
 */

// =====================================================================================
// TOKENS E HOOKS
// =====================================================================================

export { tokens, colors, typography, spacing, shadows, borderRadius, animation } from './tokens';
export { useDesignTokens } from './useDesignTokens';
export type {
  ColorScale,
  SpacingValue,
  ShadowValue,
  BorderRadiusValue,
  BreakpointValue,
  AnimationDuration,
  AnimationEasing
} from './tokens';

// =====================================================================================
// COMPONENTES BASE
// =====================================================================================

// Button
export {
  Button,
  FinancialButton,
  VideoUploadButton,
  ProposalButton
} from './components/Button';

// Card
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FinancialCard,
  VideoCard,
  ProposalCard,
  MetricCard,
  UploadCard
} from './components/Card';

// Input
export {
  Input,
  FinancialInput,
  SearchInput,
  EmailInput,
  PasswordInput
} from './components/Input';

// Loading
export {
  Loading,
  Spinner,
  DotsLoading,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonVideoPlayer,
  SkeletonFinancialDashboard
} from './components/Loading';

// =====================================================================================
// MICRO-INTERAÇÕES E ANIMAÇÕES
// =====================================================================================

// Micro-interações e animações
export { 
  microInteractions, 
  createAnimation, 
  customKeyframes, 
  animationClasses, 
  performanceOptimizations 
} from './animations/microInteractions';
export { 
  useMicroInteractions, 
  useEntranceAnimation, 
  useHoverEffect, 
  useLoadingAnimation 
} from './animations/useMicroInteractions';
export {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedContainer,
  AnimatedList,
  AnimatedModal,
  AnimatedNotification,
  AnimatedProgress
} from './animations/AnimatedComponents';

// Sistema de responsividade
export {
  breakpoints,
  deviceCategories,
  containerSizes,
  gridSystem,
  responsiveTypography,
  responsiveSpacing,
  layoutPatterns,
  responsiveUtilities
} from './responsive/breakpoints';
export {
  useResponsive,
  useDevice,
  useBreakpoint,
  useOrientation
} from './responsive/useResponsive';
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveShowHide,
  ResponsiveAspectRatio
} from './responsive/ResponsiveComponents';

// =====================================================================================
// UTILITÁRIOS
// =====================================================================================

// Função para combinar classes CSS
export { cn } from '../utils/cn';

// =====================================================================================
// CONSTANTES DO DESIGN SYSTEM
// =====================================================================================

export const DESIGN_SYSTEM_VERSION = '1.0.0';

export const COMPONENT_VARIANTS = {
  button: ['primary', 'secondary', 'success', 'warning', 'error', 'ghost'] as const,
  card: ['default', 'financial', 'video', 'proposal'] as const,
  input: ['default', 'error', 'success', 'disabled'] as const,
  loading: ['spinner', 'skeleton', 'pulse', 'dots'] as const
} as const;

export const COMPONENT_SIZES = {
  button: ['sm', 'md', 'lg', 'xl'] as const,
  card: ['sm', 'md', 'lg', 'xl'] as const,
  input: ['sm', 'md', 'lg'] as const,
  loading: ['sm', 'md', 'lg', 'xl'] as const
} as const;

// =====================================================================================
// HELPERS DE VALIDAÇÃO
// =====================================================================================

export const isValidVariant = (
  component: keyof typeof COMPONENT_VARIANTS,
  variant: string
): boolean => {
  return (COMPONENT_VARIANTS[component] as readonly string[]).includes(variant);
};

export const isValidSize = (
  component: keyof typeof COMPONENT_SIZES,
  size: string
): boolean => {
  return (COMPONENT_SIZES[component] as readonly string[]).includes(size);
};

// =====================================================================================
// CONFIGURAÇÕES GLOBAIS
// =====================================================================================

export const DESIGN_CONFIG = {
  // Configurações de animação
  animation: {
    defaultDuration: '300ms',
    defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reducedMotion: false,
    enableGPU: true,
    performanceMode: 'auto' as 'auto' | 'high' | 'low'
  },
  
  // Configurações de responsividade
  responsive: {
    enabled: true,
    mobileFirst: true,
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    },
    containerTypes: ['default', 'content', 'narrow', 'wide'],
    gridTypes: ['financial', 'video', 'proposal'],
    debounceMs: 150
  },
  
  // Configurações de acessibilidade
  accessibility: {
    focusVisible: true,
    reducedMotion: false,
    highContrast: false
  },
  
  // Configurações de micro-interações
  microInteractions: {
    enabled: true,
    hoverEffects: true,
    focusEffects: true,
    loadingAnimations: true,
    entranceAnimations: true,
    debugMode: false
  },
  
  // Configurações específicas do domínio
  domain: {
    financial: {
      currency: 'BRL',
      locale: 'pt-BR',
      precision: 2,
      animateNumbers: true
    },
    video: {
      supportedFormats: ['mp4', 'webm', 'ogg'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      defaultQuality: '720p',
      previewAnimations: true
    },
    proposal: {
      supportedFormats: ['pdf', 'docx', 'pptx'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      defaultTemplate: 'standard',
      dragDropAnimations: true
    }
  }
} as const;

// =====================================================================================
// TIPOS GLOBAIS
// =====================================================================================

export type ComponentVariant<T extends keyof typeof COMPONENT_VARIANTS> = 
  typeof COMPONENT_VARIANTS[T][number];

export type ComponentSize<T extends keyof typeof COMPONENT_SIZES> = 
  typeof COMPONENT_SIZES[T][number];

export type DesignSystemConfig = typeof DESIGN_CONFIG;

// =====================================================================================
// PROVIDER DE CONTEXTO (FUTURO)
// =====================================================================================

// Placeholder para futuro provider de contexto do design system
export interface DesignSystemContextValue {
  config: DesignSystemConfig;
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  updateConfig: (config: Partial<DesignSystemConfig>) => void;
}

// =====================================================================================
// DOCUMENTAÇÃO
// =====================================================================================

export const DESIGN_SYSTEM_DOCS = {
  overview: 'Sistema de design padronizado para Solara Nova Energia',
  version: DESIGN_SYSTEM_VERSION,
  components: {
    Button: {
      description: 'Componente de botão com múltiplas variações e estados',
      variants: COMPONENT_VARIANTS.button,
      sizes: COMPONENT_SIZES.button,
      animations: ['scale', 'lift', 'glow'],
      examples: {
        primary: '<Button variant="primary">Calcular</Button>',
        financial: '<FinancialButton>Analisar VPL</FinancialButton>',
        loading: '<Button loading>Processando...</Button>',
        animated: '<AnimatedButton hoverEffect="scale">Botão Animado</AnimatedButton>'
      }
    },
    Card: {
      description: 'Componente de cartão para organização de conteúdo',
      variants: COMPONENT_VARIANTS.card,
      sizes: COMPONENT_SIZES.card,
      animations: ['fade', 'slide', 'scale', 'lift'],
      examples: {
        financial: '<FinancialCard>Resultados</FinancialCard>',
        video: '<VideoCard>Player</VideoCard>',
        metric: '<MetricCard>KPI</MetricCard>',
        animated: '<AnimatedCard entranceAnimation="slide" hoverEffect>Conteúdo</AnimatedCard>'
      }
    },
    Input: {
      description: 'Componente de entrada com validação e estados visuais',
      variants: COMPONENT_VARIANTS.input,
      sizes: COMPONENT_SIZES.input,
      animations: ['focus', 'shake', 'glow'],
      examples: {
        financial: '<FinancialInput label="Valor do investimento" />',
        search: '<SearchInput placeholder="Buscar módulos..." />',
        password: '<PasswordInput label="Senha" />',
        animated: '<AnimatedInput focusEffect state="success" />'
      }
    },
    Loading: {
      description: 'Componentes de carregamento e skeleton loading',
      variants: COMPONENT_VARIANTS.loading,
      sizes: COMPONENT_SIZES.loading,
      animations: ['pulse', 'shimmer', 'spin', 'bounce'],
      examples: {
        spinner: '<Spinner text="Calculando..." />',
        skeleton: '<SkeletonCard />',
        financial: '<SkeletonFinancialDashboard />',
        animated: '<AnimatedProgress value={75} animate />'
      }
    },
    Animations: {
      description: 'Sistema de micro-interações e animações',
      types: ['entrance', 'hover', 'focus', 'loading', 'transition'],
      effects: ['fade', 'slide', 'scale', 'bounce', 'shake', 'glow'],
      performance: ['GPU acceleration', 'reduced motion', 'will-change optimization'],
      examples: {
        container: '<AnimatedContainer entranceType="fade" hoverEffect="scale">',
        list: '<AnimatedList items={items} staggerDelay={100} />',
        modal: '<AnimatedModal isOpen={true} animate>Conteúdo</AnimatedModal>'
      }
    },
    Responsive: {
      description: 'Sistema de responsividade e adaptação de layout',
      breakpoints: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      devices: ['mobile', 'tablet', 'desktop'],
      features: ['adaptive layouts', 'responsive typography', 'device detection', 'orientation handling'],
      examples: {
        container: '<ResponsiveContainer type="content" padding={{ xs: "4", lg: "8" }}>',
        grid: '<ResponsiveGrid type="financial" gap={{ xs: "4", lg: "6" }}>',
        stack: '<ResponsiveStack direction={{ xs: "column", lg: "row" }}>',
        text: '<ResponsiveText size={{ xs: "lg", lg: "2xl" }}>',
        showHide: '<ResponsiveShowHide hideOn="mobile">Desktop only</ResponsiveShowHide>'
      }
    }
  },
  tokens: {
    colors: 'Paleta de cores padronizada com variações semânticas',
    typography: 'Sistema tipográfico com Inter e Source Sans Pro',
    spacing: 'Escala de espaçamentos baseada em múltiplos de 0.25rem',
    shadows: 'Sombras específicas para diferentes contextos',
    animation: 'Durações e easings padronizados para micro-interações'
  }
} as const;

export default {
  // Core
  tokens,
  useDesignTokens,
  
  // Components
  Button,
  Card,
  Input,
  Loading,
  
  // Animations
  microInteractions,
  useMicroInteractions,
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedContainer,
  AnimatedList,
  AnimatedModal,
  AnimatedNotification,
  AnimatedProgress,
  
  // Responsive
  breakpoints,
  useResponsive,
  useDevice,
  useBreakpoint,
  useOrientation,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveShowHide,
  ResponsiveAspectRatio,
  
  // Configuration
  DESIGN_CONFIG,
  DESIGN_SYSTEM_DOCS
};